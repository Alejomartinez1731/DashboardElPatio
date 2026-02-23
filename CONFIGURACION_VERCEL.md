# Configuración de Variables de Entorno en Vercel

## Problema
El dashboard muestra error porque las variables de entorno no están configuradas en Vercel.

## Solución

### 1. Configurar Variable en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona el proyecto `elpatio-dashboard`
3. Ve a **Settings** → **Environment Variables**
4. Agrega la siguiente variable:

| Nombre | Valor | Entornos |
|--------|-------|----------|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | `https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data` | Production, Preview, Development |

5. Haz clic en **Save**
6. **IMPORTANTE**: Ve a **Deployments** →haz clic en los 3 puntos del deployment más reciente → **Redeploy**

### 2. Verificar la Conexión

Después del redeploy, abre en tu navegador:
```
https://tu-domain.vercel.app/api/test-connection
```

Deberías ver algo como:
```json
{
  "env": {
    "NEXT_PUBLIC_N8N_WEBHOOK_URL": "https://n8n-alejo...",
    "GOOGLE_SHEETS_SPREADSHEET_ID": "1UCAY6..."
  },
  "webhookTest": {
    "status": "HTTP 200",
    "keys": ["base_de_datos", "historico_precios", ...]
  }
}
```

### 3. Si aún falla

#### Opción A: El webhook de n8n requiere autenticación
Contacta al administrador de n8n para agregar el dominio de Vercel a los permitidos.

#### Opción B: El webhook de n8n está caído
Verifica que el URL sea accesible:
```bash
curl https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data
```

#### Opción C: Error de CORS
El webhook de n8n debe tener estos headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

## Debugging

Ver los logs de Vercel:
1. Ve a **Deployments** en Vercel
2. Selecciona el deployment más reciente
3. Haz clic en la pestaña **Logs**
4. Busca errores relacionados con `/api/sheets`

## Datos de prueba (modo desarrollo)

Si necesitas probar sin el webhook, puedes crear un endpoint mock en `src/app/api/sheets/mock/route.ts`
