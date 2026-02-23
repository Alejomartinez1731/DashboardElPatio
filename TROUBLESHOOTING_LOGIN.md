# 🩺 Troubleshooting - Login Issues

## Problema: "Pongo la contraseña pero no carga las páginas"

### Pasos para Diagnosticar:

## 1. Abrir la Consola del Navegador

**Chrome/Edge:**
- Presiona `F12`
- Ve a la pestaña **"Console"**
- Ingresa la contraseña: `Elpatio1`
- Mira si hay errores rojos

**Firefox:**
- Presiona `F12`
- Ve a la pestaña **"Consola"**
- Ingresa la contraseña: `Elpatio1`
- Mira si hay errores

---

## 2. Ver la Pestaña "Network"

**En las DevTools (F12):**
- Ve a la pestaña **"Network"**
- Ingresa la contraseña: `Elpatio1`
- Busca estas peticiones:

### Deberías ver:
1. `POST /api/auth/login` → Status: **200** ✅
2. `GET /dashboard` → Status: **200** ✅

### Si ves:
- `POST /api/auth/login` → Status: **401** o **404** ❌
  - **Problema**: La API no está funcionando
  - **Solución**: Ver logs de Vercel

- `GET /dashboard` → Status: **302** o **307** (redirect loop) ❌
  - **Problema**: El middleware está redirigiendo en bucle
  - **Solución**: La cookie no se está creando correctamente

- `GET /dashboard` → Status: **500** ❌
  - **Problema**: Error en el servidor
  - **Solución**: Ver logs de Vercel

---

## 3. Verificar Cookies

**En el navegador:**

**Chrome/Edge:**
- Presiona `F12`
- Ve a la pestaña **"Application"**
- En la sidebar, ve a **"Storage"** → **"Cookies"** → **"https://dashboard-el-patio.vercel.app"**
- Busca una cookie llamada: `dashboard_session`

**Firefox:**
- Presiona `F12`
- Ve a la pestaña **"Storage"**
- En la sidebar, ve a **"Cookies"** → **"https://dashboard-el-patio.vercel.app"**
- Busca una cookie llamada: `dashboard_session`

### ¿Qué deberías ver?
- **Nombre**: `dashboard_session`
- **Valor**: Algo como `{"expiresAt":1234567890,"createdAt":1234567890}`
- **HttpOnly**: ✅ (check)
- **Secure**: ✅ (check)
- **SameSite**: `lax`
- **Path**: `/`

### Si NO ves la cookie:
**Problema**: La sesión no se está creando
**Posible causa**: La API de login está fallando

**Solución**:
1. Ve a Vercel → Deployments → Logs
2. Busca errores en `/api/auth/login`
3. Verifica que `DASHBOARD_PASSWORD` esté configurada correctamente

---

## 4. Ver Logs de Vercel

**En Vercel:**
1. Ve a: **https://vercel.com/dashboard**
2. Selecciona: **dashboard-el-patio**
3. Ve a: **Deployments**
4. Selecciona el deployment más reciente
5. Abre la pestaña **"Logs"** o **"Function Logs"**

**Busca:**
- 🔐 Auth check logs
- ❌ Error logs
- ✅ Login exitoso logs

---

## 5. Probar en Modo Incógnito

**Abre una ventana de incógnito:**
- Chrome: `Ctrl + Shift + N`
- Edge: `Ctrl + Shift + P`
- Firefox: `Ctrl + Shift + P`

**En la ventana incógnito:**
1. Ve a: https://dashboard-el-patio.vercel.app
2. Ingresa la contraseña: `Elpatio1`
3. Abre DevTools (F12)
4. Ve a Console

**¿Funciona en incógnito pero no en normal?**
- **Problema**: Cookies o cache corruptas
- **Solución**: Limpia cookies y cache del navegador

---

## 6. Verificar el Estado del Dashboard

**Después del login, ¿qué ves?**

### Opción A: Pantalla en blanco
- **Problema**: Error en el componente del dashboard
- **Solución**: Ver Console (F12) para ver el error

### Opción B: Página de login nuevamente
- **Problema**: Cookie no se creó o middleware la rechaza
- **Solución**: Ver Application tab para verificar cookies

### Opción C: "Conectado a n8n" pero sin datos
- **Problema**: El webhook de n8n falla
- **Solución**: Es un problema diferente (no de autenticación)

### Opción D: Loading infinito
- **Problema**: El hook useSheetData está colgado
- **Solución**: Ver Network tab (F12) para ver si `/api/sheets` responde

---

## 7. Información para el Desarrollador

**Por favor, cuando reportes el problema, incluye:**

1. **¿Qué ves después de poner la contraseña?**
   - [ ] Pantalla en blanco
   - [ ] Vuelve a /login
   - [ ] Se queda cargando
   - [ ] Muestra error
   - [ ] Otro (describe)

2. **¿Qué dice la Console (F12)?**
   - Copia y pega los errores rojos

3. **¿Qué dice la pestaña Network (F12)?**
   - ¿`/api/auth/login` dio 200?
   - ¿`/dashboard` dio qué status?

4. **¿Hay cookie `dashboard_session`?**
   - [ ] Sí
   - [ ] No

---

## 8. Soluciones Rápidas

### Solución 1: Limpiar Cookies
```
1. F12 → Application → Cookies
2. Eliminar todas las cookies del dominio
3. Recargar la página
4. Intentar login nuevamente
```

### Solución 2: Usar Incógnito
```
1. Abrir ventana incógnito
2. Ir a https://dashboard-el-patio.vercel.app
3. Hacer login
4. Si funciona, limpiar cache del navegador normal
```

### Solución 3: Verificar Variable de Entorno
```
1. Vercel → Settings → Environment Variables
2. Verificar que DASHBOARD_PASSWORD existe
3. Verificar que el valor sea: Elpatio1 (sin espacios)
4. Redeploy si hice cambios
```

---

## 9. Logs de Debug

**Los nuevos commits agregaron logs de debug:**

En la consola del navegador deberías ver:
```
🔐 Auth check: Cookie found, valid=true, expiresAt=2026-02-24...
✅ Login exitoso, creando sesión...
✅ Sesión creada correctamente
```

**Si NO ves estos logs:**
- El código nuevo no se ha deployado
- Espera a que Vercel termine el deploy

**Para verificar tu deploy:**
1. Ve a Vercel → Deployments
2. Busca el commit: `3a9864f` (o más reciente)
3. Espera a que esté en "Ready"

---

**Última actualización**: 23/02/2026
**Versión**: 1.0
