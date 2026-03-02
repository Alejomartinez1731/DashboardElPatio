# Configuración del Módulo de Recordatorios de Reposición

## Resumen de Implementación

Se ha implementado un sistema de recordatorios de reposición que permite configurar productos para recibir alertas cuando pasa un tiempo determinado sin comprarlos.

### Archivos Creados/Modificados

**Creados:**
- `src/app/api/recordatorios/route.ts` - API Route (GET, POST, DELETE)
- `src/components/dashboard/recordatorios-reposicion.tsx` - Componente UI
- `src/types/index.ts` - Tipos `Recordatorio`, `RecordatorioRaw`, `EstadoRecordatorio`

**Modificados:**
- `src/app/dashboard/page.tsx` - Añadida la sección de Recordatorios

---

## PASO 1: Crear la Hoja en Google Sheets

ANTES de probar el sistema, debes crear manualmente la hoja "Recordatorios" en el spreadsheet:

1. Abre el spreadsheet de El Patio:
   - ID: `1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g`
   - URL: https://docs.google.com/spreadsheets/d/1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g

2. Crea una nueva hoja llamada exactamente: **Recordatorios**

3. En la fila 1, añade los cabeceros:
   - A1: `Producto`
   - B1: `Dias`
   - C1: `Activo`
   - D1: `Notas`

4. Ejemplo de filas (opcional, para pruebas):
   ```
   A2: POLLO GRANDE    |  B2: 3  |  C2: TRUE  |  D2: Comprar en BonArea
   A3: HUEVOS          |  B3: 7  |  C3: TRUE  |  D3:
   A4: LECHE           |  B4: 4  |  C4: TRUE  |  D4:
   ```

---

## PASO 2: Configurar Google Sheets API Key

El sistema necesita acceso de lectura/escritura a Google Sheets.

**Opción A: Usar API Key existente (si ya funciona para lectura)**

El proyecto ya tiene configurada una API Key en `.env.local`:
```
NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY=tu_api_key_aqui
```

Si esta API Key tiene permisos de escritura, el sistema funcionará.

**Opción B: Configurar API Key con permisos de escritura**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Busca "Google Sheets API" y asegúrate de que esté habilitada
4. Ve a "Credentials" → "Create Credentials" → "API Key"
5. Copia la API Key y pégala en `.env.local`

---

## PASO 3: Verificar Permisos de la Hoja

Para que la API funcione, la hoja debe estar compartida correctamente:

1. Abre el spreadsheet
2. Click en "Compartir" (Share)
3. Asegúrate de que "Anyone with the link" tenga permiso de **Editor** o **Viewer**
4. Si usas una cuenta de servicio, añádela como editor

---

## PASO 4: Probar el Sistema

### 4.1. Iniciar el servidor de desarrollo

```bash
cd "C:\Users\Alejandro Martínez\Documents\elpatio-dashboard"
npm run dev
```

### 4.2. Abrir el dashboard

1. Ve a `http://localhost:3000`
2. Loguéate con la contraseña: `Elpatio1`
3. Verás la nueva sección "Recordatorios de Reposición" debajo de "Presupuesto Mensual"

### 4.3. Probar funcionalidades

**Añadir un recordatorio:**
1. Click en "[+ Añadir]"
2. Escribe un producto (ej: "POLLO")
3. Define los días (ej: 3)
4. Añade notas opcionales
5. Click en "Guardar Recordatorio"

**Verificar cálculo:**
- El sistema buscará en "Registro Diario" y "Histórico de Precios"
- Mostrará la última fecha de compra encontrada
- Calculará los días transcurridos
- Asignará un estado (vencido, próximo, ok, sin datos)

**Eliminar un recordatorio:**
1. Click en el icono de papelera del recordatorio
2. Confirma la eliminación

---

## Estados de Recordatorios

| Estado | Condición | Color | Acción |
|--------|-----------|-------|--------|
| **Vencido** | diasTranscurridos >= diasConfigurados | Rojo | Reposición urgente |
| **Próximo** | diasTranscurridos >= diasConfigurados × 0.7 | Ámbar | Planificar compra |
| **OK** | diasTranscurridos < diasConfigurados × 0.7 | Verde | Sin acción |
| **Sin datos** | Producto no encontrado en ninguna hoja | Gris | Revisar nombre |

---

## Búsqueda Parcial de Productos

La búsqueda de productos es **PARCIAL** (case-insensitive):

| Recordatorio | Encuentra | NO encuentra |
|--------------|-----------|--------------|
| POLLO | POLLO GRANDE, PECHUGA DE POLLO, POLLO ENTERO | PAVI, POLLO+ (símbolos raros) |
| LECHE | LECHE ENTERA, LECHE SEMI, YOGUR LECHE | BEBIDA SOJA |

**Recomendación:** Usa nombres genéricos y cortos para mejores resultados.

---

## API Endpoints

### GET /api/recordatorios
Retorna todos los recordatorios con su estado calculado.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "producto": "POLLO GRANDE",
      "diasConfigurados": 3,
      "ultimaCompra": "2026-02-25T00:00:00.000Z",
      "diasTranscurridos": 5,
      "estado": "vencido",
      "tiendaUltimaCompra": "bonArea (T431)",
      "precioUltimaCompra": 6.16,
      "notas": "Comprar en BonArea"
    }
  ],
  "timestamp": "2026-03-02T10:30:00.000Z"
}
```

### POST /api/recordatorios
Crea un nuevo recordatorio.

**Body:**
```json
{
  "producto": "POLLO GRANDE",
  "dias": 3,
  "notas": "Comprar en BonArea"
}
```

### DELETE /api/recordatorios
Elimina un recordatorio.

**Body:**
```json
{
  "producto": "POLLO GRANDE"
}
```

---

## Troubleshooting

### Error: "Hoja 'Recordatorios' no encontrada"

**Solución:** Crea la hoja manualmente en Google Sheets (ver PASO 1).

### Error: "No hay credenciales de Google Sheets configuradas"

**Solución:** Configura `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` en `.env.local`.

### Los recordatorios no se guardan

**Posibles causas:**
1. API Key sin permisos de escritura
2. Hoja no compartida correctamente
3. Error en el nombre de la hoja (debe ser exactamente "Recordatorios")

**Solución:** Verifica los permisos en Google Cloud Console y los permisos de compartición de la hoja.

### Los estados se calculan mal

**Posibles causas:**
1. La hoja "Registro Diario" o "Histórico de Precios" no existen
2. Los nombres de productos no coinciden (búsqueda parcial)
3. Las fechas están en formato incorrecto

**Solución:**
- Verifica que las hojas de datos existen
- Usa nombres de productos más genéricos
- Revisa el formato de fechas en las hojas (YYYY-MM-DD o DD/MM/YYYY)

---

## Testing Checklist

- [ ] La sección de recordatorios aparece en el Panel General
- [ ] Se pueden añadir nuevos recordatorios
- [ ] Se pueden eliminar recordatorios
- [ ] Los estados (vencido, próximo, ok, sin_datos) se calculan correctamente
- [ ] La búsqueda parcial funciona (buscar "POLLO" encuentra "POLLO GRANDE")
- [ ] Los recordatorios se ordenan por urgencia
- [ ] Los datos se guardan en la hoja "Recordatorios" de Google Sheets
- [ ] Las demás secciones del Panel General siguen funcionando igual
- [ ] El diseño es responsive y consistente con el tema oscuro

---

## Próximos Pasos (Futuras Mejoras)

1. **KPI en la barra principal**: Añadir contador de reposiciones pendientes
2. **Notificaciones**: Alertas push o email cuando haya productos vencidos
3. **Historial de compras**: Mostrar historial completo de compras de un producto
4. **Sugerencias**: Sugerir productos basados en el historial
5. **Categorías**: Agrupar recordatorios por categoría de producto

---

## Notas Técnicas

- **Framework**: Next.js 16.1.6 (App Router) + React 19
- **UI**: Shadcn/ui + Tailwind CSS 4 + Lucide Icons
- **API**: Google Sheets API v4 (paquete `googleapis`)
- **Estado**: React hooks (useState, useEffect, useCallback)
- **Tipado**: TypeScript 5

---

## Contacto

Si encuentras algún problema o necesitas ayuda, revisa el archivo `TROUBLESHOOTING_LOGIN.md` o contacta al desarrollador.
