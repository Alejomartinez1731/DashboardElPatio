# Configuración de n8n para Recordatorios

El sistema ahora usa **n8n** para leer y escribir recordatorios. Necesitas añadir la hoja "Recordatorios" al workflow existente de n8n.

---

## PASO 1: Modificar el Workflow de n8n "dashboard-data"

1. Entra a tu panel de n8n
2. Busca el workflow **"dashboard-data"** (el que ya existe)
3. Edítalo

---

## PASO 2: Añadir Nodo para Leer "Recordatorios"

En el workflow, busca donde están los nodos de Google Sheets que leen las hojas (probablemente hay varios nodos "Google Sheets" conectados).

Añade un nuevo nodo **Google Sheets → Get Values**:

```
Operation: Get Values
Sheet ID: 1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g
Sheet Name: Recordatorios
Range: A:D
```

---

## PASO 3: Añadir al Nodo Final de Respuesta

Busca el nodo final del workflow que retorna los datos (probablemente un nodo **"Set"** o **"Code"** que construye la respuesta JSON).

Añade la hoja "Recordatorios" a la respuesta:

### Si es un nodo **Code**:

Añade al objeto de retorno:

```javascript
// Leer la hoja Recordatorios (nodo que acabas de añadir)
const recordatoriosValues = $input.last().json.values;  // Ajusta según tu flujo

// En la respuesta final, añade:
return {
  success: true,
  data: {
    // ... hojas existentes ...
    recordatorios: {
      values: $node["Google Sheets2"].json.values  // Ajusta el nombre del nodo
    },
    // o directamente:
    recordatorios: {
      values: recordatoriosValues
    }
  },
  timestamp: new Date().toISOString()
};
```

### Si es un nodo **Set**:

Añade un nuevo campo:

```
Name: data.recordatorios.values
Value: {{ $node["Google Sheets - Recordatorios"].json.values }}
```

---

## PASO 4: Guardar y Activar

1. **Save** el workflow
2. **Active** el workflow (esquina superior derecha)
3. **Test** el workflow para verificar que funciona

---

## PASO 5: Probar

Ve a **https://dashboard-el-patio.vercel.app** después del deploy y:

1. Abre DevTools (F12)
2. Pestaña **Network**
3. Busca la petición `recordatorios`
4. **Response** debería mostrar:

```json
{
  "success": true,
  "data": [...],  // ← Aquí aparecerán tus recordatorios
  "timestamp": "..."
}
```

---

## DIAGRAMA DEL WORKFLOW DE n8n

```
Webhook (dashboard-data)
    │
    ├─→ Google Sheets (Get "Registro Diario")
    ├─→ Google Sheets (Get "Histórico de Precios")
    └─→ Google Sheets (Get "Recordatorios")  ← NUEVO
            │
            ▼
         [Combina todo en una respuesta JSON]
```

---

## TESTING DEL WORKFLOW EN n8n

1. En n8n, click en **"Test workflow"**
2. Verifica que la respuesta incluya:
   ```json
   {
     "data": {
       "registro_diario": {...},
       "historico_precios": {...},
       "recordatorios": {...}  ← Debe aparecer esto
     }
   }
   ```

---

## ¿PROBLEMAS?

### Si no ves la hoja "Recordatorios" en n8n

1. Abre el Google Sheet
2. Verifica que la hoja se llame exactamente: **Recordatorios**
3. Verifica que tenga datos (al menos los cabeceros en la fila 1)

### Si el workflow da error

1. Verifica que el Sheet ID sea correcto: `1UCAY6IsniDZTXHZWRDOVVcaihFsAtvOiE-e7N6p1G9g`
2. Verifica que la hoja esté compartida con la cuenta de servicio de n8n

### Si sigues sin ver los recordatorios en el dashboard

1. Abre DevTools → Network
2. Busca la petición `recordatorios`
3. **Response** y copia el JSON aquí
4. Revisa los logs de Vercel para ver qué dice

---

## REGISTRO DE CAMBIOS

- **Fecha**: 2026-03-02
- **Cambio**: Eliminado uso de Google Sheets API para lectura
- **Motivo**: Error "The caller does not have permission"
- **Solución**: Usar n8n para todas las hojas
