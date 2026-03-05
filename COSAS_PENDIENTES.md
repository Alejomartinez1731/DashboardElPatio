# 📋 Cosas Pendientes - El Patio Dashboard

> **Estado Actual:** Migración a Supabase 100% completada ✅
> **Última actualización:** 2026-03-05
> **URL Producción:** https://elpatio-dashboard-xi.vercel.app

---

## ✅ Completado

- [x] Migración completa de Google Sheets/n8n a Supabase
- [x] `/registro` - Registro de compras
- [x] `/proveedores` - Análisis por proveedor
- [x] `/precios` - Análisis de precios
- [x] `/facturas` - Historial de facturas
- [x] `/dashboard` - Panel general
- [x] `/recordatorios` - Sistema de recordatorios de reposición

---

## 🔴 PRIORIDAD ALTA - Mejoras Financieras

### 1. KPIs Financieros Avanzados
**Impacto:** ★★★★★ | **Complejidad:** Media | **Tiempo:** 6-8h

Crear nuevos indicadores financieros en el dashboard:

- **Margen de Ahorro:** (Presupuesto - Gasto) / Presupuesto × 100
- **Velocidad de Gasto:** Gasto diario promedio × días restantes del mes
- **Índice de Inflación:** Variación porcentual de precios de productos recurrentes
- **Score de Proveedor:** Calificación (1-5) basada en precio + frecuencia + disponibilidad
- **Tasa de Compras:** Número de compras por día/semana/mes

**Archivos a crear:**
- `src/app/api/kpis-avanzados/route.ts`
- `src/lib/calculadoras-financieras.ts`
- Actualizar `src/app/dashboard/page.tsx` para mostrar nuevos KPIs

---

### 2. Presupuestos por Categoría
**Impacto:** ★★★★★ | **Complejidad:** Media | **Tiempo:** 8-10h

Implementar control de gastos por categoría de producto:

**Base de datos:**
```sql
CREATE TABLE presupuestos_categoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID REFERENCES restaurantes(id),
  categoria VARCHAR(50), -- 'Lácteos', 'Carnes', 'Verduras', etc.
  monto_decimal DECIMAL(10,2),
  periodo_mes INT,
  periodo_anio INT,
  UNIQUE(restaurante_id, categoria, periodo_mes, periodo_anio)
);
```

**Funcionalidades:**
- Definir presupuesto mensual por categoría
- Alerta visual cuando se excede 80% del presupuesto
- Gráfico de barras comparando gastos vs presupuesto
- Historial de presupuestos por mes

**Archivos a crear:**
- `scripts/create-presupuestos-categoria.sql`
- `src/app/api/presupuestos/route.ts`
- `src/app/presupuestos/page.tsx`
- Componente de gráfico de comparación

---

### 3. Alertas de Gasto en Tiempo Real
**Impacto:** ★★★★ | **Complejidad:** Baja | **Tiempo:** 4-6h

Sistema de notificaciones cuando se exceden límites:

**Opciones de implementación:**
1. **Polling (recomendado):** Verificar cada 30-60 segundos
2. **Server-Sent Events (SSE):** Conexión persistente
3. **WebSocket:** Más complejo, tiempo real real

**Tipos de alertas:**
- Se excedió 80% del presupuesto mensual
- Se excedió 80% del presupuesto de categoría
- Producto con aumento de precio > 10%
- Recordatorio vencido

**Archivos a crear:**
- `src/lib/alerts.ts`
- `src/components/notifications/notification-center.tsx`
- `src/hooks/useAlerts.ts` (polling cada 30s)

---

### 4. Análisis de Tendencias de Precios (Inflación)
**Impacto:** ★★★★ | **Complejidad:** Media | **Tiempo:** 6-8h

Detectar aumentos de precio en productos recurrentes:

**Algoritmo:**
1. Identificar productos que se compran ≥ 3 veces
2. Calcular variación de precio entre compras consecutivas
3. Agrupar por producto y calcular tendencia
4. Mostrar productos con > 5% de aumento

**Métricas:**
- Variación porcentual promedio
- Productos con mayor inflación
- Gráfico de línea por producto
- Predicción de precio próximo mes

**Archivos a crear:**
- `src/app/api/inflacion/route.ts`
- `src/app/inflacion/page.tsx`
- Función SQL para calcular tendencias

---

## 🟡 PRIORIDAD MEDIA - Funcionalidades

### 5. Comparativa Período vs Anterior
**Impacto:** ★★★ | **Complejidad:** Baja | **Tiempo:** 3-4h

La función SQL ya existe (`comparar_periodos`), solo falta la UI:

**Mostrar en dashboard:**
- Tarjeta con comparación mes actual vs mes anterior
- Variación en € y %
- Flecha verde (bajada) o roja (subida)
- Desglose por tienda

**Archivos a modificar:**
- `src/components/dashboard/dashboard-kpis.tsx`

---

### 6. Optimización de Consultas SQL
**Impacto:** ★★ | **Complejidad:** Baja | **Tiempo:** 2-3h

Crear índices en columnas frecuentemente consultadas:

```sql
-- Índices para compras
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_compras_producto ON compras(descripcion);
CREATE INDEX IF NOT EXISTS idx_compras_tienda ON compras(tienda);

-- Índices compuestos
CREATE INDEX IF NOT EXISTS idx_compras_restaurante_fecha
  ON compras(restaurante_id, fecha DESC);
```

**Archivos a crear:**
- `scripts/optimize-indexes.sql`

---

### 7. Multi-tenant (Múltiples Restaurantes)
**Impacto:** ★★★ | **Complejidad:** Alta | **Tiempo:** 12-16h

Soporte para varios restaurantes en una misma BD:

**Cambios requeridos:**
1. Agregar `tenant_id` a todas las tablas
2. Row Level Security (RLS) por tenant
3. Selector de restaurante en UI
4. Middleware para validar tenant

**Archivos a modificar:**
- `src/middleware.ts` - Validar tenant
- Todas las API routes - Filtrar por tenant_id
- Todas las páginas - Agregar selector

---

### 8. Exportación de Datos Mejorada
**Impacto:** ★★★ | **Complejidad:** Media | **Tiempo:** 4-6h

Funciones de exportación avanzadas:

**Formatos:**
- Excel con múltiples hojas
- CSV personalizado
- PDF con gráficos
- JSON para backups

**Filtros de exportación:**
- Por rango de fechas
- Por tienda
- Por categoría

**Archivos a crear:**
- `src/lib/export-advanced.ts`
- `src/components/export/export-modal.tsx`

---

## 🟢 PRIORIDAD BAJA - Mejoras Técnicas

### 9. Predicción de Gasto Mensual (Forecasting)
**Impacto:** ★★★ | **Complejidad:** Alta | **Tiempo:** 10-12h

Predecir gasto del mes basado en historial:

**Opciones:**
1. **Regresión lineal simple:** Mes anterior × tendencia
2. **Promedio móvil:** Últimos 3-6 meses
3. **Machine Learning:** (overkill para este caso)

**Archivos a crear:**
- `src/lib/forecasting.ts`
- `src/app/api/forecasting/route.ts`
- Componente de predicción en dashboard

---

### 10. Detección de Anomalías
**Impacto:** ★★ | **Complejidad:** Media | **Tiempo:** 6-8h

Detectar compras inusuales:

**Tipos de anomalías:**
- Precio muy alto/outlier (±3 desviaciones estándar)
- Cantidad inusualmente grande
- Compra en tienda no habitual
- Producto comprado fuera de temporada

**Archivos a crear:**
- `src/lib/anomaly-detection.ts`
- `src/app/api/anomalias/route.ts`
- Página de revisión de anomalías

---

### 11. Tests E2E con Playwright
**Impacto:** ★★★ | **Complejidad:** Media | **Tiempo:** 8-10h

Tests end-to-end para flujos críticos:

**Escenarios a testear:**
- Login/logout (cuando se active)
- Carga de dashboard
- Filtros en tabla de compras
- Crear/eliminar recordatorio
- Exportar datos

**Archivos a crear:**
- `e2e/dashboard.spec.ts`
- `e2e/recordatorios.spec.ts`
- `e2e/compras.spec.ts`

---

### 12. Auditoría de Cambios
**Impacto:** ★★ | **Complejidad:** Media | **Tiempo:** 8-10h

Log de todas las acciones importantes:

**Eventos a registrar:**
- Cambios en presupuestos
- Creación/eliminación de recordatorios
- Exportaciones de datos
- Cambios en configuración

**Archivos a crear:**
- `scripts/create-audit-log.sql`
- `src/lib/audit.ts`
- Página de historial de cambios

---

## 📋 Orden Recomendado de Implementación

### Fase 1 - Quick Wins (Alto valor, baja complejidad)
1. ✅ Presupuestos por categoría
2. ✅ Comparativa período vs anterior
3. ✅ Alertas de gasto (polling simple)

### Fase 2 - Análisis Avanzado
4. ✅ KPIs financieros avanzados
5. ✅ Tendencias de precios (inflación)
6. ✅ Optimización SQL (índices)

### Fase 3 - Funcionalidades Extra
7. ✅ Exportación mejorada
8. ✅ Multi-tenant
9. ✅ Tests E2E

### Fase 4 - Inteligencia
10. ✅ Forecasting (predicción)
11. ✅ Detección de anomalías
12. ✅ Auditoría de cambios

---

## 📝 Notas

- **Tecnologías actuales:** Next.js 16, React 19, Supabase, Zustand
- **Base de datos:** PostgreSQL (vía Supabase)
- **Deploy:** Vercel
- **Estado:** Producción

---

## 🚀 Cómo Usar Este Documento

Para continuar con el desarrollo:

1. Revisar las tareas pendientes arriba
2. Elegir una tarea según prioridad
3. Decirme: *"Vamos con la tarea X"*
4. Yo me encargaré de la implementación

**Ejemplo:**
> "Ve al documento de cosas pendientes y sigamos con la tarea 2"

---

**Última revisión:** 2026-03-05
**Próxima revisión:** Al completar una tarea
