# Dashboard El Patio & Grill

Dashboard de gestión para restaurante con análisis de gastos, proveedores, precios y más.

## 🚀 Getting Started (Desarrollo Local)

### Prerrequisitos

- Node.js 18+
- npm/yarn/pnpm

### Instalación

1. Clona el repositorio:
```bash
git clone <tu-repo-url>
cd elpatio-dashboard
```

2. Instala dependencias:
```bash
npm install
```

3. Configura las variables de entorno:

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# n8n Webhook URL (para obtener datos de Google Sheets)
N8N_WEBHOOK_URL=https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data

# n8n Webhook URL para recordatorios (ESCRITURA)
N8N_RECORDATORIOS_WEBHOOK_URL=https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/Recordatorios
```

> **IMPORTANTE**: La variable `N8N_WEBHOOK_URL` NO debe tener el prefijo `NEXT_PUBLIC_` porque se usa en el servidor (API routes).

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔧 Configuración de Variables de Entorno

### Explicación de Variables

| Variable | Prefijo | Uso | ¿En Vercel? |
|----------|---------|-----|-------------|
| `N8N_WEBHOOK_URL` | Sin prefijo | API route - Lee datos de n8n | ✅ Configurar |
| `N8N_RECORDATORIOS_WEBHOOK_URL` | Sin prefijo | API route - Escribe recordatorios | ✅ Configurar |
| `NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID` | `NEXT_PUBLIC_` | Cliente - ID del spreadsheet | ❌ Opcional |
| `NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY` | `NEXT_PUBLIC_` | Cliente - API key de Google | ❌ Opcional |

### ¿Por qué algunas variables NO tienen NEXT_PUBLIC_?

Las variables con `NEXT_PUBLIC_` se exponen al navegador (pueden verse en el código fuente).
Las variables SIN `NEXT_PUBLIC_` solo están disponibles en el servidor (API routes).

**Nunca** pongas `NEXT_PUBLIC_` en variables sensibles como URLs de webhook internos.

## 🌐 Deploy en Vercel

### Paso 1: Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Navega a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

```
N8N_WEBHOOK_URL
Valor: https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data
Entornos: Production, Preview, Development

N8N_RECORDATORIOS_WEBHOOK_URL
Valor: https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/Recordatorios
Entornos: Production, Preview, Development
```

4. Haz clic en **Save**

### Paso 2: Redesplegar

Opción A - Desde Vercel Dashboard:
1. Ve a **Deployments**
2. Haz clic en el botón **...** del deployment más reciente
3. Selecciona **Redeploy**

Opción B - Desde git:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Paso 3: Verificar

Después del redeploy, visita `/diagnostico-api` y verifica:
- **Source**: `n8n` (no debe decir `mock`)
- **Is Mock**: ✅ NO

## 📊 Diagnóstico

Si los datos no se muestran correctamente:

1. Visita `/diagnostico-api`
2. Revisa los campos:
   - **Success**: ✅
   - **Source**: `n8n`
   - **Is Mock**: ✅ NO
   - **Warning**: (debe estar vacío)

3. Si dice **Is Mock: ⚠️ YES**, revisa:
   - Que `N8N_WEBHOOK_URL` esté configurada en Vercel
   - Que el webhook de n8n esté accesible
   - Los logs del servidor en Vercel

## 🛠️ Stack Tecnológico

- **Next.js 16** - App Router
- **React 19** - UI
- **TypeScript** - Tipado
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos
- **Zustand** - Estado global
- **Zod** - Validación de datos
- **Lucide React** - Iconos
- **n8n** - Integración con Google Sheets

## 📝 Estructura del Proyecto

```
src/
├── app/
│   ├── api/                # API Routes
│   │   └── sheets/         # Endpoint de datos
│   ├── dashboard/          # Panel principal
│   ├── registro/           # Registro de compras
│   ├── precios/            # Análisis de precios
│   ├── proveedores/        # Proveedores
│   ├── facturas/           # Facturas
│   └── settings/           # Configuración
├── components/
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # Componentes UI base
├── lib/                    # Utilidades
│   ├── cache.ts            # Sistema de caché
│   ├── logger.ts           # Logging
│   ├── data-utils.ts       # Procesamiento de datos
│   └── formatters.ts       # Formato de moneda/fecha
└── types/                  # TypeScript types
```

## 📄 Licencia

Proyecto privado para El Patio & Grill.
