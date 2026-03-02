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

## PASO 2: Configurar el Webhook en n8n (OBLIGATORIO para guardar/eliminar)

El sistema necesita **n8n** para guardar y eliminar recordatorios en Google Sheets.

### 2.1. Crear un nuevo workflow en n8n

1. Entra a tu panel de n8n
2. Crea un nuevo workflow llamado "Dashboard - Recordatorios"
3. Añade un nodo **Webhook** con la siguiente configuración:
   - **Method**: POST
   - **Path**: `recordatorios` (o el que quieras)
   - **Response Mode**: "When Last Node Finishes"

4. Copia la URL del webhook (será algo como):
   ```
   https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/recordatorios
   ```

### 2.2. Configurar el workflow para manejar acciones

Añade un nodo **Switch** después del Webhook:

```javascript
// Expresión para el Switch
{{ $json.action }}
```

Crear 3 rutas:
1. **append** - Para añadir recordatorios
2. **delete** - Para eliminar recordatorios
3. **default** - Para errores

### 2.3. Ruta "append" (Añadir recordatorio)

Añade estos nodos después de la ruta "append":

**Nodo: Google Sheets → Append**
```
Operation: Append
Sheet ID: 1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g
Sheet Name: Recordatorios
Range: A:D
Values: {{ $json.row }}
  - A: {{ $json.row[0] }} (Producto)
  - B: {{ $json.row[1] }} (Dias)
  - C: {{ $json.row[2] }} (Activo)
  - D: {{ $json.row[3] }} (Notas)
```

**Nodo: Respond to Webhook**
```json
{
  "success": true,
  "message": "Recordatorio guardado"
}
```

### 2.4. Ruta "delete" (Eliminar recordatorio)

Añade estos nodos después de la ruta "delete":

**Nodo: Google Sheets → Get Values** (para leer la hoja)
```
Operation: Get Values
Sheet ID: 1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g
Sheet Name: Recordatorios
Range: A:D
```

**Nodo: Code** (para encontrar y eliminar la fila)
```javascript
// Leer datos
const data = $input.all();
const rows = data[0].json.values || [];
const producto = $json.producto;

// Encontrar la fila
let rowIndex = -1;
for (let i = 1; i < rows.length; i++) {
  const rowProducto = String(rows[i][0] || '').trim().toLowerCase();
  if (rowProducto === producto.toLowerCase()) {
    rowIndex = i;
    break;
  }
}

if (rowIndex === -1) {
  return [{ json: { success: false, error: 'Producto no encontrado' } }];
}

// Crear array sin la fila a eliminar
const newRows = rows.filter((_, idx) => idx !== rowIndex);

// Convertir a formato para Google Sheets
const values = newRows;

return [{ json: { values, rowIndex } }];
```

**Nodo: Google Sheets → Update Values** (escribir de nuevo)
```
Operation: Update Values
Sheet ID: 1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g
Sheet Name: Recordatorios
Range: A1
Values: {{ $json.values }}
```

**Nodo: Respond to Webhook**
```json
{
  "success": true,
  "message": "Recordatorio eliminado"
}
```

### 2.5. Añadir la variable de entorno

En `.env.local`, añade la URL del webhook:

```bash
# Webhook de n8n para recordatorios (ESCRITURA)
N8N_RECORDATORIOS_WEBHOOK_URL=https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/recordatorios
```

---

## PASO 3: Actualizar el workflow existente de n8n (para lectura)

El workflow actual de n8n ("dashboard-data") debe incluir la hoja "Recordatorios" en la respuesta.

### 3.1. Añadir nodo para leer Recordatorios

En tu workflow de n8n, añade un nodo **Google Sheets → Get Values**:

```
Operation: Get Values
Sheet ID: 1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g
Sheet Name: Recordatorios
Range: A:D
```

### 3.2. Añadir a la respuesta final

En el nodo final que retorna los datos, añade:

```javascript
return {
  success: true,
  data: {
    // ... datos existentes ...
    recordatorios: valoresRecordatorios,
  },
  timestamp: new Date().toISOString(),
};
```

---

## PASO 4: Verificar Permisos de la Hoja

Para que n8n funcione, la hoja debe estar compartida correctamente:

1. Abre el spreadsheet
2. Click en "Compartir" (Share)
3. Asegúrate de que la cuenta de servicio de n8n tenga acceso como **Editor**
4. Si usas OAuth, asegúrate de que el token tenga permisos de `spreadsheetsReadWrite`

---

## PASO 5: Probar el Sistema

### 5.1. Iniciar el servidor de desarrollo

```bash
cd "C:\Users\Alejandro Martínez\Documents\elpatio-dashboard"
npm run dev
```

### 5.2. Abrir el dashboard

1. Ve a `http://localhost:3000`
2. Loguéate con la contraseña: `Elpatio1`
3. Verás la nueva sección "Recordatorios de Reposición" debajo de "Presupuesto Mensual"

### 5.3. Probar funcionalidades

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
- Asignará un estado (vencido, próximo, ok, sin_datos)

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
Crea un nuevo recordatorio vía n8n.

**Body:**
```json
{
  "producto": "POLLO GRANDE",
  "dias": 3,
  "notas": "Comprar en BonArea"
}
```

**Envía a n8n:**
```json
{
  "action": "append",
  "sheet": "Recordatorios",
  "row": ["POLLO GRANDE", "3", "TRUE", "Comprar en BonArea"]
}
```

### DELETE /api/recordatorios
Elimina un recordatorio vía n8n.

**Body:**
```json
{
  "producto": "POLLO GRANDE"
}
```

**Envía a n8n:**
```json
{
  "action": "delete",
  "sheet": "Recordatorios",
  "producto": "POLLO GRANDE"
}
```

---

## Troubleshooting

### Error: "No hay webhook de n8n configurado para guardar recordatorios"

**Solución:**
1. Configura `N8N_RECORDATORIOS_WEBHOOK_URL` en `.env.local`
2. Verifica que el workflow de n8n esté activo
3. Prueba el webhook directamente con Postman o curl

### Error: "Hoja 'Recordatorios' no encontrada"

**Solución:** Crea la hoja manualmente en Google Sheets (ver PASO 1).

### Los recordatorios no se guardan

**Posibles causas:**
1. El webhook de n8n no está activo
2. La hoja no está compartida con la cuenta de servicio de n8n
3. Error en el nombre de la hoja (debe ser exactamente "Recordatorios")
4. El workflow de n8n no responde correctamente

**Solución:**
1. Verifica que el webhook de n8n esté activo (test node)
2. Verifica los permisos de compartición de la hoja
3. Revisa los logs de n8n para ver errores
4. Prueba el workflow manualmente desde n8n

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

- [ ] La hoja "Recordatorios" existe en Google Sheets
- [ ] El webhook de n8n está activo y responde
- [ ] N8N_RECORDATORIOS_WEBHOOK_URL está configurado en .env.local
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

## Notas Técnicas

- **Framework**: Next.js 16.1.6 (App Router) + React 19
- **UI**: Shadcn/ui + Tailwind CSS 4 + Lucide Icons
- **Backend**: n8n webhooks para escritura en Google Sheets
- **Estado**: React hooks (useState, useEffect, useCallback)
- **Tipado**: TypeScript 5

---

## Diagrama de Flujo

```
Dashboard → POST /api/recordatorios
                ↓
        n8n webhook (recordatorios)
                ↓
        Switch (action: append/delete)
                ↓
    ┌───────────┴───────────┐
    ↓                       ↓
Append                  Delete
    ↓                       ↓
Google Sheets           Google Sheets
    ↓                       ↓
Write row               Delete row
    ↓                       ↓
Respond {success:true}  Respond {success:true}
```
