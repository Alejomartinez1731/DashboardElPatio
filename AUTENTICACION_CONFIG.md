# ⚠️ CONFIGURACIÓN REQUERIDA - Autenticación del Dashboard

## IMPORTANTE - LEER ANTES DE USAR

El dashboard ahora tiene **autenticación obligatoria**. Debes configurar una contraseña en Vercel.

---

## 🚨 PASO 1: Configurar Contraseña en Vercel

1. Ve a: **https://vercel.com/dashboard**
2. Selecciona el proyecto: **dashboard-el-patio**
3. Ve a: **Settings** → **Environment Variables**
4. Agrega esta variable:

```
Nombre: DASHBOARD_PASSWORD
Valor: [TU_CONTRASEÑA_SEGURA_AQUI]
Entornos: Production, Preview, Development
```

5. Haz clic en **Save**

### 💡 Ejemplos de contraseñas seguras:
```
 patio2026!grill
 V1la-s3ca.Tarragona
 ElPati0$2026*
```

**NO uses**: `admin`, `123456`, `password`, `admin123`

---

## 🔁 PASO 2: Redeploy el Proyecto

Después de agregar la variable:

1. Ve a: **Deployments**
2. Busca el deployment más reciente
3. Haz clic en los **3 puntos (⋮)**
4. Selecciona: **Redeploy**
5. Espera a que termine el deploy (2-3 minutos)

---

## ✅ PASO 3: Verificar que Funciona

1. Abre: **https://dashboard-el-patio.vercel.app**
2. Deberías ver la **página de login** con el logo 🍽️
3. Ingresa la contraseña que configuraste
4. Deberías acceder al dashboard normalmente

---

## 🔐 Cómo Funciona la Autenticación

### Características de Seguridad:
- ✅ **Cookie segura**: httpOnly, Secure en producción
- ✅ **Sesión de 24 horas**: El usuario debe volver a loguearse después de 24h
- ✅ **Middleware**: Todas las rutas están protegidas
- ✅ **Rutas públicas**: Solo `/login` y `/api/*`

### Flujo de Autenticación:
```
Usuario intenta acceder al dashboard
         ↓
Middleware verifica cookie de sesión
         ↓
¿Hay cookie válida?
    ↓                ↓
   NO              SÍ
    ↓                ↓
Redirect a /login   Accede al dashboard
    ↓
Usuario ingresa contraseña
    ↓
POST a /api/auth/login
    ↓
¿Contraseña correcta?
    ↓                ↓
   NO              SÍ
    ↓                ↓
Mensaje de error   Crear cookie
    ↓                ↓
   ...          Redirect a /dashboard
```

---

## 🚪 Cerrar Sesión

Para hacer logout:

1. Haz clic en el avatar **"EP"** en la esquina superior derecha
2. Se abre un menú dropdown
3. Haz clic en **"Cerrar Sesión"**
4. Serás redirigido a `/login`

---

## 🛠️ Cambiar la Contraseña

Si necesitas cambiar la contraseña:

1. Ve a **Vercel** → **Settings** → **Environment Variables**
2. Edita la variable `DASHBOARD_PASSWORD`
3. Haz clic en **Save**
4. Ve a **Deployments** → **Redeploy**

**Nota**: Cambiar la contraseña cerrará todas las sesiones activas. Todos los usuarios tendrán que volver a loguearse.

---

## 📱 Acceso Móvil

La autenticación funciona en:
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablets (iPad, Android tablets)

La cookie de sesión persiste por 24 horas en todos los dispositivos.

---

## ⚠️ Troubleshooting

### Problema: "Error interno del servidor" al hacer login

**Causa**: No configuraste `DASHBOARD_PASSWORD` en Vercel.

**Solución**:
1. Ve a Vercel → Settings → Environment Variables
2. Agrega `DASHBOARD_PASSWORD` con tu contraseña
3. Redeploy el proyecto

---

### Problema: "Contraseña incorrecta" (y estás seguro que es correcta)

**Causa**: Puede haber espacios en blanco o caracteres especiales.

**Solución**:
1. En Vercel, edita la variable
2. Asegúrate de que no haya espacios al inicio o final
3. Usa caracteres simples: letras, números, !, @, #, $, %
4. Redeploy

---

### Problema: No puedo acceder al dashboard después del deploy

**Causa**: El middleware está redirigiendo a `/login` pero hay un error.

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca errores en la pestaña "Console"
3. Ve a Vercel → Deployments → ver logs del deployment
4. Contacta a soporte si el error persiste

---

## 🔒 Recomendaciones de Seguridad

1. **Contraseña fuerte**: Mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos
2. **Cambiar periódicamente**: Cada 3-6 meses
3. **No compartirla**: Solo personal autorizado
4. **Usar HTTPS**: Vercel ya lo hace automáticamente
5. **Monitorear accesos**: Revisa los logs de Vercel periódicamente

---

## 📞 Soporte

Si tienes problemas:

1. Revisa este documento
2. Verifica los logs en Vercel
3. Abre un issue en GitHub
4. Contacta al desarrollador

---

**Última actualización**: 23/02/2026
**Versión**: 1.1
**Estado**: Activo
