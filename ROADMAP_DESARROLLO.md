# ROADMAP DESARROLLO - Dashboard El Patio & Grill

**Fecha de creación**: 23/02/2026
**Proyecto**: Dashboard de compras y gastos - Restaurante El Patio & Grill
**Ubicación**: `C:\Users\Alejandro Martínez\Documents\elpatio-dashboard`
**URL Producción**: https://dashboard-el-patio.vercel.app

---

## 📋 ESTADO ACTUAL DEL PROYECTO

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router) + React 19 + TypeScript 5
- **UI**: Shadcn/ui + Tailwind CSS 4 + Lucide Icons
- **Charts**: Recharts
- **Data**: Google Sheets API vía n8n webhook
- **Deploy**: Vercel

### Páginas Implementadas
1. `/dashboard` - Panel principal con 4 pestañas (histórico, costosos, gasto por tienda, base de datos)
2. `/registro` - Registro de compras con paginación
3. `/precios` - Análisis de precios con gráficos
4. `/proveedores` - Análisis por proveedor
5. `/facturas` - Vista de facturas agrupadas
6. `/diagnostico` - Diagnóstico del sistema

### Problemas Identificados
- **dashboard/page.tsx tiene 766 líneas** (demasiado grande)
- **parsearFecha() copiada en 4 archivos** (violación DRY)
- **Sin autenticación** (datos financieros expuestos)
- **Dependencia total de n8n** (single point of failure)
- **Sin fallback** cuando el webhook falla

---

## 🎯 PLAN DE TRABAJO - 3 FASES

## FASE 1: SANEAR (1-2 días)

### Objetivo
Eliminar tech debt crítico y hacer el código mantenible.

### Tarea 1.1: Extraer lógica de parseo a lib/parsers.ts
**Archivo a crear**: `src/lib/parsers.ts`

**Contenido**:
```typescript
// Función unificada de parseo de fechas
export function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? new Date() : fecha;
  if (!fecha || typeof fecha !== 'string') return new Date();

  if (fecha.includes('/')) {
    const partes = fecha.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(p => parseInt(p.trim(), 10));
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
        return new Date(anio, mes - 1, dia);
      }
    }
  }
  const parsed = new Date(fecha);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Excluir filas de resumen (TOTAL, IVA, etc.)
export function excluirFilaResumen(descripcion: string): boolean {
  if (!descripcion) return true;
  const descripcionLower = descripcion.toLowerCase().trim();
  if (descripcionLower === '') return true;
  const exclusiones = ['suma total', 'total general', 'total', 'subtotal', 'sub-total', 'iva', 'vat', 'tax', 'base imponible', 'base', 'recargo', 'equivalencia', 'devolución', 'devolucion', 'devoluc', '-'];
  return exclusiones.some(exclusion => descripcionLower.includes(exclusion));
}
```

**Prompt para Claude**:
```
Lee los archivos dashboard/page.tsx, registro/page.tsx, y precios/page.tsx. Identifica dónde están las funciones parsearFecha() y excluirFilaResumen(). Reemplázalas con importaciones de src/lib/parsers.ts y elimina las versiones duplicadas.
```

---

### Tarea 1.2: Crear hook useSheetData
**Archivo a crear**: `src/hooks/useSheetData.ts`

**Prompt para Claude**:
```
Crea un custom hook useSheetData en src/hooks/useSheetData.ts que:

1. Use useState y useEffect
2. Haga fetch a /api/sheets
3. Procese los datos (normalice cabeceras, parse fechas, excluya filas resumen)
4. Retorne: { data, loading, error, refetch }

Luego actualiza dashboard/page.tsx para usar este hook en lugar de tener toda la lógica de fetch dentro del componente.
```

---

### Tarea 1.3: Agregar autenticación básica
**Opción A: Usar NextAuth.js (recomendado)**

**Prompt para Claude**:
```
Instala NextAuth.js:
npm install next-auth @auth/core

Configura autenticación simple con credenciales hardcoded:
- Usuario: admin
- Password: (definir una segura)

Protege todas las rutas del dashboard con middleware.ts.
Agrega página de login en /login.
```

**Opción B: Protección simple con password (más rápido)**

**Prompt para Claude**:
```
Crea un sistema de autenticación simple:
1. Middleware que verifique una cookie de sesión
2. Página /login con password hardcoded
3. Cookie de sesión válida por 24 horas

Usa cookies() de next/headers.
```

---

### Tarea 1.4: Implementar fallback cuando n8n falle
**Prompt para Claude**:
```
Modifica src/app/api/sheets/route.ts para:

1. Intentar fetch al webhook de n8n
2. Si falla (timeout, error, 404), intentar fetch directo a Google Sheets API
3. Si eso también falla, retornar datos mock del endpoint /api/sheets/mock

Agrega lógica de reintentos (3 intentos con exponential backoff).
```

---

## FASE 2: FEATURES DE ALTO VALOR (3-5 días)

### Objetivo
Agregar funcionalidades que dan valor inmediato al negocio.

### Tarea 2.1: Comparativa vs mes anterior
**Prompt para Claude**:
```
Crea un nuevo componente en src/components/dashboard/monthly-comparison.tsx que:

1. Reciba las compras del mes actual y mes anterior
2. Calcule: variación %, diferencia en €, tendencia (arriba/abajo)
3. Muestre una tarjeta visual con flecha (↑↓) y color (rojo/verde)
4. Incluye breakdown por categoría de producto

Integra este componente en el dashboard principal debajo de los KPIs existentes.
```

---

### Tarea 2.2: Presupuesto mensual con alertas
**Prompt para Claude**:
```
Crea un sistema de presupuesto mensual:

1. Agrega variable de entorno NEXT_PUBLIC_PRESUPUESTO_MENSUAL=3000
2. Crea componente budget-progress.tsx que muestre:
   - Barra de progreso (gastado vs presupuesto)
   - Porcentaje utilizado
   - Color verde (<80%), amarillo (80-95%), rojo (>95%)
   - Proyección de fin de mes
3. Agrega alerta visual cuando se exceda el 90%
4. Añade input para cambiar el presupuesto (guardar en localStorage)

Muestra este componente prominentemente en el dashboard.
```

---

### Tarea 2.3: Exportación real a Excel
**Prompt para Claude**:
```
Instala librería xlsx:
npm install xlsx

Crea función exportToExcel en src/lib/export-excel.ts que:

1. Reciba datos de tabla y nombre de archivo
2. Genere un Excel real con:
   - Hojas separadas por cada pestaña del dashboard
   - Formato: cabeceras en negrita, columnas con ancho automático
   - Filtros en las cabeceras
   - Números con formato de moneda €
3. Reemplaza la exportación CSV actual

Actualiza QuickActions para usar esta nueva función.
```

---

### Tarea 2.4: Categorización de productos
**Prompt para Claude**:
```
Crea sistema de categorías:

1. Define tipos de categorías en src/types/index.ts:
   type Categoria = 'carnes' | 'lacteos' | 'verdura' | 'panaderia' | 'bebidas' | 'limpieza' | 'otros'

2. Crea src/lib/categorias.ts con mapeo producto→categoría:
   export const categorizarProducto = (producto: string): Categoria => { ... }

3. Agrega columna CATEGORÍA en tabla de dashboard
4. Crea filtro por categoría en FilterPanel
5. Agrega gráfico de pastel con distribución por categoría
6. Muestra KPI: gasto por categoría

Usa búsqueda de palabras clave para asignar categoría automáticamente.
```

---

## FASE 3: OPTIMIZACIÓN (2-3 días)

### Objetivo
Mejorar performance y arquitectura para escalabilidad.

### Tarea 3.1: Implementar Zustand para state management
**Prompt para Claude**:
```
Instala Zustand:
npm install zustand

Crea src/store/useDashboardStore.ts con:
- Estado global de compras
- Estado de filtros
- Acciones para actualizar filtros
- Acciones para refrescar datos

Refactoriza dashboard/page.tsx para usar el store en lugar de useState locales.
```

---

### Tarea 3.2: Descomponer dashboard en componentes pequeños
**Prompt para Claude**:
```
Descompone src/app/dashboard/page.tsx (766 líneas) en:

1. src/components/dashboard/dashboard-header.tsx
2. src/components/dashboard/dashboard-kpis.tsx
3. src/components/dashboard/dashboard-tabs.tsx
4. src/components/dashboard/data-table.tsx
5. src/components/dashboard/data-table-row.tsx

Cada componente debe tener ≤100 líneas.
Usa composition para pasar datos entre componentes.
```

---

### Tarea 3.3: Agregar skeleton loaders y optimistic UI
**Prompt para Claude**:
```
Crea skeleton loaders en src/components/ui/skeleton.tsx (si no existe)

Modifica dashboard/page.tsx para:
1. Mostrar skeleton cards mientras cargan KPIs
2. Mostrar skeleton table mientras cargan datos
3. No bloquear la UI durante fetch
4. Agregar botón de refresh con estado loading visual

Usa los componentes Skeleton de Shadcn.
```

---

## 📝 COMO USAR ESTE DOCUMENTO

### Para retomar trabajo en cualquier momento:

1. **Abre una nueva conversación con Claude**
2. **Copia y pega el prompt correspondiente** a la tarea que quieres continuar
3. **Claude tendrá todo el contexto** de lo que estamos haciendo

### Ejemplo de prompt para continuar:

```
ESTOY TRABAJANDO EN EL ROADMAP DEL DASHBOARD EL PATIO.

Ya completé:
- FASE 1: Tareas 1.1, 1.2, 1.3 (autenticación con NextAuth)

Ahora quiero continuar con FASE 1, Tarea 1.4: Implementar fallback cuando n8n falle.

El proyecto está en: C:\Users\Alejandro Martínez\Documents\elpatio-dashboard

Por favor lee la tarea 1.4 en el roadmap y ejecuta las instrucciones.
```

---

## ✅ CHECKLIST DE PROGRESO

Marca las tareas completadas:

### FASE 1: SANEAR
- [x] 1.1 Extraer lógica de parseo a lib/parsers.ts ✅ COMPLETADO (23/02/2026)
- [x] 1.2 Crear hook useSheetData ✅ COMPLETADO (23/02/2026)
- [ ] 1.3 Agregar autenticación básica
- [ ] 1.4 Implementar fallback cuando n8n falle

### FASE 2: FEATURES DE ALTO VALOR
- [ ] 2.1 Comparativa vs mes anterior
- [ ] 2.2 Presupuesto mensual con alertas
- [ ] 2.3 Exportación real a Excel
- [ ] 2.4 Categorización de productos

### FASE 3: OPTIMIZACIÓN
- [ ] 3.1 Implementar Zustand para state management
- [ ] 3.2 Descomponer dashboard en componentes pequeños
- [ ] 3.3 Agregar skeleton loaders y optimistic UI

---

## 🚀 COMANDOS ÚTILES

### Para desarrollar localmente:
```bash
cd "C:\Users\Alejandro Martínez\Documents\elpatio-dashboard"
npm run dev
```

### Para hacer deploy a Vercel:
```bash
git add .
git commit -m "feat: describe los cambios"
git push
```

### Para ver logs de Vercel:
Visita: https://vercel.com/dashboard → proyecto → Deployments → ver logs

---

## 🔗 VARIABLES DE ENTORNO REQUERIDAS

En Vercel (Settings → Environment Variables):

```
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data
NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID=1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g
USE_MOCK_DATA=false
NEXT_PUBLIC_PRESUPUESTO_MENSUAL=3000
```

Si usas NextAuth, agrega también:
```
NEXTAUTH_SECRET=generar_con_openssl_rand_base64_32
NEXTAUTH_URL=https://dashboard-el-patio.vercel.app
```

---

## 📞 SOPORTE

Si algo no funciona, dile a Claude:

```
Hay un error en el dashboard El Patio.

Error: [describe el error con detalles]

Estaba trabajando en: [FASE X, TAREA Y]

Archivos recientemente modificados: [lista si puedes]

Por favor ayuda a diagnosticar y solucionar.
```

---

**Última actualización**: 23/02/2026
**Versión**: 1.0
**Estado**: En progreso - Fase 1 (2 de 4 tareas completadas)
