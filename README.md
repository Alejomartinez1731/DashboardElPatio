# Dashboard Docentes - Microbits Academy

Dashboard web para visualizar datos de estudiantes, preguntas, temas y estadísticas de cursos, conectado a workflows de N8N.

## 🚀 Despliegue en Vercel

### Opción 1: Importar desde GitHub (Recomendado)

1. **Subir este código a GitHub**
2. **Ir a [vercel.com](https://vercel.com)**
3. **Hacer clic en "Add New..." → "Project"**
4. **Importar el repositorio de GitHub**
5. **Hacer clic en "Deploy"**

Vercel detectará automáticamente que es un proyecto estático y lo desplegará.

### Opción 2: Con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar despliegue
vercel
```

## 📁 Estructura del proyecto

```
interfaz-microbits/
├── index.html              # Página principal
├── app.js                  # Lógica de la aplicación
├── styles.css              # Estilos
├── api/
│   └── n8n-proxy.js       # Serverless Function para Vercel (Proxy a N8N)
├── vercel.json            # Configuración de Vercel
└── README.md              # Este archivo
```

## 🔧 Configuración

### Webhooks de N8N

El proyecto está configurado para conectarse a:
- **Base URL**: `https://micro-bits-n8n.aejhww.easypanel.host/webhook`
- **Endpoints**:
  - `/dashboard-cursos` - Lista de cursos disponibles
  - `/dashboard-estudiantes?curso=ID` - Estudiantes del curso
  - `/dashboard-preguntas?curso=ID` - Preguntas frecuentes
  - `/dashboard-temas?curso=ID` - Temas consultados
  - `/dashboard-contador?curso=ID` - Estadísticas de actividad
  - `/toggle-estudiante` - Habilitar/deshabilitar estudiante

### Nota sobre CORS

Los workflows de N8N **deben permitir CORS** o usar el proxy incluido en este proyecto.

## 📋 Funcionalidades

- ✅ Selección de cursos
- ✅ Visualización de estudiantes con estado (habilitado/deshabilitado)
- ✅ Tabla de preguntas frecuentes con fechas
- ✅ Ranking de estudiantes más activos
- ✅ Temas más consultados con estadísticas
- ✅ Búsqueda y filtrado en tiempo real
- ✅ Paginación de resultados
- ✅ Toggle para habilitar/deshabilitar estudiantes
- ✅ Métricas en tiempo real

## 🛠️ Tecnologías

- **HTML5** - Estructura
- **JavaScript (Vanilla)** - Lógica
- **CSS3** - Estilos
- **Vercel Serverless Functions** - Proxy a N8N
- **Font Awesome** - Iconos
- **N8N** - Backend/Workflows

## 📱 Uso local

Para desarrollo local, puedes usar Live Server de VS Code, pero **necesitarás configurar CORS en N8N** o usar un servidor proxy local.

## 👥 Autores

Desarrollado para Microbits Academy

## 📄 Licencia

Privado - Uso interno de Microbits Academy
