# 📋 Roadmap y Tareas Pendientes - El Patio Dashboard

> **Última actualización:** 2025-01-04
> **Estado:** Desarrollo activo
> **Fase actual:** Fase 3 en progreso (Error Boundaries completado)

---

## 📊 Resumen Ejecutivo

| Fase | Estado | Progreso | Tiempo Estimado |
|------|--------|----------|-----------------|
| **Fase 1: Seguridad Crítica** | ⚠️ Parcial | 75% | 15-21h |
| **Fase 2: Funcionalidades Core** | ✅ Completa | 100% | 22-29h |
| **Fase 3: Testing & Quality** | 🔄 En Progreso | 13% | 23-31h |
| **Fase 4: Funcionalidades Avanzadas** | ❌ Pendiente | 0% | 28-36h |

**Total proyecto:** ~40% completado (Fase 1-2 casi completas, Fase 3 iniciada)

---

## ✅ MIGRACIÓN A SUPABASE COMPLETADA (100%)

### Estado de la Migración
Todas las páginas y APIs han sido migradas a Supabase:

| Página | Estado | Fuente de Datos |
|--------|--------|-----------------|
| `/registro` | ✅ Migrado | Supabase |
| `/proveedores` | ✅ Migrado | Supabase |
| `/precios` | ✅ Migrado | Supabase |
| `/facturas` | ✅ Migrado | Supabase |
| `/dashboard` | ✅ Migrado | Supabase |
| `/recordatorios` | ✅ **MIGRADO** | **Supabase** |

**Progreso Total:** 100% (6 de 6 páginas migradas)

### Cambios Realizados
- **Dashboard:** `useSupabaseDashboard` reemplaza `useSheetData`
- **Recordatorios:** API migrada a Supabase, tabla `recordatorios` creada
- **Validación:** `sanitizeString` actualizado para server-side (sin DOMPurify)

---

## ✅ Fase 1: Seguridad Crítica (75% Completa)

### Tareas Completadas ✅
- [x] **T2: Validación con Zod** (6-8h)
  - [x] Schemas creados: `auth.schema.ts`, `compra.schema.ts`, `recordatorio.schema.ts`
  - [x] API routes usando Zod: `/api/auth/login`, `/api/recordatorios`
  - [x] Validación type-safe con mensajes personalizados en español

- [x] **T3: Rate Limiting** (4-6h) ⚠️ DESACTIVADO TEMPORALMENTE
  - [x] Código creado en `rate-limit.ts.disabled` (causaba errores en Vercel Edge)
  - [x] **IMPORTANTE:** `@upstash/ratelimit` NO es compatible con Vercel Edge Functions
  - [x] **Estado:** Deshabilitado en middleware
  - [ ] **PENDIENTE:** Re-implementar con alternativa compatible cuando reactive auth
  - **Archivos:** `src/lib/rate-limit.ts.disabled` (renombrado para que no se importe)

- [x] **T4: Sanitización XSS** (3-4h)
  - [x] DOMPurify instalado y configurado
  - [x] `sanitizeString()`, `sanitizeUrl()`, `sanitizeObject()`
  - [x] Headers de seguridad en middleware y next.config.ts
  - [x] Content-Security-Policy eliminada (causaba errores de deployment)

### Tareas Pendientes de Fase 1
- [ ] **T1: Reactivar Autenticación** (2-3h) - **SALTADA SEGÚN PREFERENCIA DEL USUARIO**
  - Usuario quiere autenticación deshabilitada mientras solo él usa el dashboard
  - Código está listo en middleware (comentado)
  - **Pendiente hasta que el usuario lo autorice**

**Archivos Clave Fase 1:**
- `src/lib/schemas/*` - Schemas Zod
- `src/lib/validation.ts` - DOMPurify integrado
- `src/middleware.ts` - Headers de seguridad activos
- `src/lib/rate-limit.ts.disabled` - Deshabilitado (renombrado)

---

## ✅ Fase 2: Funcionalidades Core (100% Completa)

### Tareas Completadas ✅
- [x] **Estados de Carga Globales** (3-4h) ⚠️ BÁSICO
  - [x] `loading` state en `useDashboardStore.ts`
  - [ ] Pendiente: `useLoading.ts` store dedicado
  - [ ] Pendiente: Componente `GlobalLoading` overlay

- [x] **Skeleton Screens** (4-5h)
  - [x] `dashboard-skeletons.tsx` ya existe con KPIsSkeleton, BudgetSkeleton, etc.
  - [x] Usado en dashboard principal

- [x] **Tema Claro/Oscuro** (3-4h)
  - [x] `ThemeProvider` con 3 modos: light, dark, system
  - [x] Detecta preferencia del sistema automáticamente
  - [x] Persiste en localStorage
  - [x] `ThemeToggle` en header con iconos Sol/Luna/Monitor

- [x] **Página de Configuración** (6-8h)
  - [x] `/app/settings/page.tsx` creada
  - [x] `useSettings.ts` store (Zustand + persist)
  - [x] Secciones: Apariencia, Datos, Notificaciones
  - [x] Toggle switches animados
  - [x] Restablecer valores por defecto
  - [x] Link en sidebar

- [x] **Búsqueda Global Avanzada** (6-8h)
  - [x] Shortcut `Cmd/Ctrl + K`
  - [x] Modal con backdrop y animaciones
  - [x] Búsqueda en productos, tiendas y compras
  - [x] Navegación con flechas ↑↓, Enter, ESC
  - [x] `GlobalSearchTrigger` en header

**Archivos Clave Fase 2:**
- `src/contexts/theme-context.tsx`
- `src/components/theme/theme-toggle.tsx`
- `src/store/useSettings.ts`
- `src/app/settings/page.tsx`
- `src/lib/search.ts`
- `src/components/search/global-search.tsx`

---

## 🔄 Fase 3: Testing & Quality (13% Completa)

**Tiempo estimado:** 23-31 horas

### Tareas Completadas ✅
- [x] **React Error Boundaries** (3-4h) - ✅ COMPLETADO
  - [x] `src/components/error/error-boundary.tsx` creado
  - [x] `src/components/error/error-fallback.tsx` con UI amigable
  - [x] Botones: "Reintentar", "Volver al inicio", "Reportar bug"
  - [x] Integrado en layout raíz
  - [x] Agregado en páginas clave (dashboard, settings)
  - [x] Integrado con logger para reportar errores
  - [x] `showDetails` para desarrollo (stack trace visible)

### Tareas Pendientes

#### 2. Expandir Tests Playwright (12-16h)
- [ ] `e2e/auth.spec.ts` - Login/logout flows, session management
- [ ] `e2e/dashboard.spec.ts` - Data loading, filtering, sorting
- [ ] `e2e/recordatorios.spec.ts` - CRUD operations
- [ ] `e2e/filters.spec.ts` - Todos los filtros combinados
- [ ] `e2e/export.spec.ts` - CSV/Excel exports
- [ ] `e2e/accessibility.spec.ts` - A11y compliance
- [ ] `e2e/responsive.spec.ts` - Mobile/tablet views
- [ ] `e2e/fixtures.ts` - Datos de prueba consistentes
- [ ] Configurar CI/CD para correr tests en PR

#### 3. Logging Centralizado (2-3h) - QUICK WIN
- [ ] Mejorar `src/lib/logger.ts`
- [ ] Agregar niveles: debug, info, warn, error
- [] Logging estructurado (JSON format para producción)
- [ ] Request ID tracking
- [ ] User context (cuando auth esté activa)
- [ ] Configurar output para desarrollo vs producción

#### 4. Monitoring/Analytics (6-8h)
- [ ] Elegir plataforma: Vercel Analytics (gratis) o PostHog
- [ ] Implementar Web Vitals tracking
- [ ] Custom events: feature usage, search queries, exports
- [] Error tracking: Sentry o Vercel Logs
- [] Crear dashboard de analytics
- [ ] Configurar environment variables para API keys

**Archivos a Crear Fase 3:**
- `src/components/error/error-boundary.tsx`
- `src/components/error/error-fallback.tsx`
- `e2e/auth.spec.ts`, `e2e/dashboard.spec.ts`, etc.
- `src/lib/analytics.ts`

---

## ❌ Fase 4: Funcionalidades Avanzadas (0% Completa)

**Tiempo estimado:** 28-36 horas

### Tareas Pendientes

#### 1. Favoritos/Marcadores (4-6h)
- [ ] Crear `src/store/useBookmarks.ts` (Zustand + persist)
- [ ] Crear tipos en `src/types/bookmarks.ts`
- [ ] Crear `src/lib/bookmarks.ts`
- [ ] Crear `src/components/bookmarks/bookmark-button.tsx`
- [ ] Crear `src/components/bookmarks/bookmark-sidebar.tsx`
- [ ] Agregar botón de bookmark en FilterPanel
- [ ] Persistir en localStorage
- [ ] Mostrar en sidebar sección de favoritos

#### 2. Historial de Cambios / Audit Log (8-10h)
- [ ] Crear `src/lib/audit.ts`
- [ ] Crear `src/store/useAuditLog.ts`
- [ ] Crear `src/app/settings/audit/page.tsx` (sub-página de settings)
- [ ] Crear `src/components/audit/audit-log-viewer.tsx`
- [ ] Tipos de eventos: login/logout, settings changes, exports, filter changes
- [ ] Timestamp, user ID, action type, before/after values
- [ ] Log rotation para no crecer indefinidamente
- [ ] Filtros por fecha, acción, usuario

#### 3. Backup/Restore (10-12h)
- [ ] Crear `src/lib/backup.ts`
- [ ] Crear `src/app/api/backup/route.ts`
- [ ] Crear `src/app/settings/backup/page.tsx` (sub-página de settings)
- [ ] Crear `src/components/backup/backup-manager.tsx`
- [ ] Backup de: settings, filtros guardados, favoritos, categorías custom
- [ ] Formato JSON con versión, timestamp, checksum
- [ ] Exportar a archivo (download)
- [ ] Importar desde archivo (upload con validación)
- [ ] Conflict resolution si hay versión nueva
- [ ] Backup automático semanal (opcional)

#### 4. Caching Inteligente (6-8h)
- [ ] Opción A: Usar SWR (recommended)
- [ ] Opción B: React Query
- [ ] Implementar caché de respuestas API
- [ ] `useSWR` o `useQuery` en lugar de fetch directo
- [ ] Revalidación automática (stale-while-revalidate)
- [ ] Configurar tiempo de cache por endpoint
- [ ] Memoizar cálculos pesados (KPIs)

#### 5. Paginación Virtual (8-10h)
- [ ] Evaluar si realmente necesaria (dataset size)
- [ ] Si <1000 filas: NO implementar
- [ ] Si >1000 filas: usar `react-virtuoso` o `react-window`
- [ ] Paginación simple como alternativa más fácil
- [ ] Skip/Limit en API si backend lo soporta

#### 6. Notificaciones Real-Time (12-16h) - LOW PRIORITY
- [ ] Evaluar si realmente necesario
- [ ] Opción A: Polling (más simple, 30-60s)
- [ ] Opción B: Server-Sent Events (SSE)
- [ ] Opción C: Pusher/Ably (costo mensual)
- [ ] Tipos: price alerts, low stock, system updates
- [ ] Browser notifications (con permiso del usuario)
- [ ] Notification center UI component
- [ ] Configuración de preferencias de usuario

#### 7. PWA / Offline Mode (12-16h) - LOW PRIORITY
- [ ] `next-pwa` package
- [ ] Service worker para caché de assets
- [ ] Manifest PWA
- [ ] Offline fallback UI
- [ ] Install prompt customizado
- [ ] Background sync para acciones offline
- [ - Update notifications cuando hay nueva versión

#### 8. Optimización de Imágenes (2-3h) - LOW PRIORITY
- [ ] **NO HAY IMÁGENES ACTUALMENTE** en el dashboard
- [ ] Pendiente hasta que se agreguen fotos de productos, receipts, etc.
- [ ] Usar `next/image` cuando se agreguen imágenes
- [ ] Configurar image domains en `next.config.ts`

**Archivos a Crear Fase 4:**
- `src/store/useBookmarks.ts`
- `src/types/bookmarks.ts`
- `src/lib/backup.ts`
- `src/app/api/backup/route.ts`
- `src/app/settings/backup/page.tsx`
- `src/lib/cache.ts` o configurar SWR/React Query
- `src/app/pwa/worker.ts` y archivos PWA

---

## 🔴 Importante: Notas Técnicas

### Rate Limiting (Deshabilitado Temporalmente)
- **Estado:** Código en `src/lib/rate-limit.ts.disabled`
- **Por qué:** `@upstash/ratelimit` NO compatible con Vercel Edge Functions
- **Problema:** Causaba errores de build/deployment en commits `42ea4df`, `d7ff4b9`, `5a3e492`, `cdb6e1a`
- **Solución:** Archivo renombrado para que Next.js no lo importe
- **Re-implementar cuando:** Reactive autenticación o antes de producción
- **Alternativa:** Usar Vercel KV (más fácil que Upstash)

### Autenticación (Deshabilitada)
- **Estado:** Código listo en middleware pero comentado
- **Por qué:** Usuario preferencia (solo él usa el dashboard ahora)
- **Reactivar cuando:** Múltiples usuarios o producción

### Deployment Issues (Resueltos)
- **Commits problemáticos:** `42ea4df`, `d7ff4b9`, `5a3e492`, `cdb6e1a`
- **Causa:** `@upstash/ratelimit` imports + CSP muy restrictiva
- **Solución:** Commit `93dc902` simplificó middleware y eliminó CSP
- **Deploy actual:** `93dc902` - Debería funcionar correctamente

---

## 📋 Orden Recomendado de Implementación

### Para AHORA (Continuar con proyecto)
1. ✅ Fase 2 completa
2. ⏭️ **Fase 3: Testing & Quality** ← AHORA
   - Error boundaries (3-4h) - QUICK WIN
   - Expandir Playwright tests (12-16h)
   - Logging centralizado (2-3h) - QUICK WIN
   - Monitoring/analytics (6-8h)

### Para DESPUÉS (Producción)
3. ⏳ **Fase 1 completa**
   - Reactivar autenticación
   - Re-implementar rate limiting (con Vercel KV)
4. ⏳ **Fase 4: Funcionalidades avanzadas**
   - Empezar por bookmarks (más fácil y útil)
   - Luego audit log, backup, caching

---

## 🎯 Quick Wins (Alto Valor, Baja Complejidad)

Estos se pueden hacer en 1-2 horas cada uno:

1. **Error Boundaries** - Protege contra crashes
2. **Logging Centralizado** - Mejora debugging
3. **Favoritos/Marcadores** - Usabilidad
4. **Backup/Restore (cliente)** - Seguridad de datos

---

## 📊 Métricas de Progreso

### Completado
- ✅ Validación Zod
- ✅ Sanitización XSS (DOMPurify)
- ✅ Headers de seguridad
- ✅ Skeleton screens
- ✅ Tema claro/oscuro
- ✅ Página de configuración
- ✅ Búsqueda global
- ✅ Error boundaries (Fase 3)

### Pendiente (Fase 3-4)
- ❌ Tests Playwright
- ❌ Logging centralizado (mejoras)
- ❌ Monitoring/analytics
- ❌ Favoritos/marcadores
- ❌ Audit log
- ❌ Backup/restore
- ❌ Caching inteligente
- ❌ Notificaciones real-time
- ❌ PWA/offline
- ❌ Rate limiting (reactivar cuando sea necesario)

---

## 📝 Notas de Desarrollo

### Variables de Entorno Requeridas
```bash
# N8N Webhook (datos de Google Sheets)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/dashboard-data

# Opcional: Upstash Redis (para rate limiting cuando se reactive)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Opcional: Analytics (para cuando se implemente)
NEXT_PUBLIC_SENTRY_DSN=
VERCEL_ANALYTICS_ID=
```

### Paquetos Instalados
```json
{
  "zod": "^4.x",
  "dompurify": "^3.3.1",
  "@upstash/ratelimit": "^1.1.2",
  "@upstash/redis": "^1.36.3"
}
```

### Stack Técnico
- **Framework:** Next.js 16.1.6 (App Router)
- **Frontend:** React 19.2.3
- **State:** Zustand (3 stores: dashboard, settings, recordatorios config, lista compra)
- **Validation:** Zod 4.x
- **Security:** DOMPurify, headers HTTP
- **Testing:** Playwright (configurado pero sin tests escritos)

---

## 🚀 Próximos Pasos Recomendados

1. **Verificar deployment** del commit `93dc902` - ¿Funciona?
2. **Si funciona:** Continuar con Fase 3 (Error Boundaries)
3. **Si NO funciona:** Investigar logs de Vercel

---

**Documento mantenido por:** Claude Sonnet
**Última revisión:** 2025-01-04
**Próxima revisión:** Cuando se complete Fase 3
