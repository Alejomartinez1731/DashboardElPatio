# Reglas para Claude Code - Dashboard El Patio

Este archivo contiene las reglas que Claude debe seguir al trabajar en este proyecto.

---

## 🚀 Reglas de Rendimiento Vercel

**CRÍTICO:** El proyecto tiene un límite de invocaciones en Vercel. Seguir estas reglas es obligatorio.

### 1. Polling Mínimo
- **NUNCA** crear `setInterval` con intervalos menores a **300 segundos (5 minutos)** para llamadas a API routes
- Excepción: Para actualizaciones locales de estado (sin llamadas a API) se puede usar menos tiempo

### 2. useEffect sin Optimización
- **NUNCA** hacer `fetch` a `/api/` dentro de un `useEffect` sin:
  - Cache en memoria, o
  - Debounce, o
  - Prevención de llamadas simultáneas (isFetchingRef)

### 3. Cache en Memoria
- **SIEMPRE** usar cache en memoria para datos que no cambian frecuentemente
- TTL recomendado: 5 minutos (300,000 ms)
- Ejemplo:
  ```typescript
  const cache = new Map<string, { data: any; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000;
  ```

### 4. Visibility API para Polling
- **SIEMPRE** pausar polling cuando el tab no está visible
- Usar `document.visibilityState` para detectar visibilidad
- Reanudar polling cuando el usuario vuelve al tab
- Ejemplo:
  ```typescript
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  intervalRef.current = setInterval(() => {
    if (document.visibilityState === 'visible') {
      verificarAhora(); // Solo si el tab está visible
    }
  }, intervalo * 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      verificarAhora(); // Verificación inmediata al volver
    }
  });
  ```

### 5. Debounce en Búsquedas
- **SIEMPRE** usar debounce de al menos **300ms** en inputs de búsqueda
- El estado local del input debe actualizarse inmediatamente (UX)
- El filtro/global store debe actualizarse DESPUÉS del debounce
- Ejemplo:
  ```typescript
  const [busquedaLocal, setBusquedaLocal] = useState(filtros.busqueda);
  const debounceRef = useRef<NodeJS.Timeout | undefined>();

  const handleBusquedaChange = (value: string) => {
    setBusquedaLocal(value); // Inmediato para UX
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      onFiltrosChange({ ...filtros, busqueda: value }); // Después del debounce
    }, 300);
  };
  ```

### 6. Supabase vs API Routes
- **PREFERIR** consultas directas a Supabase sobre API routes de Vercel
- Las API routes generan invocaciones a Vercel
- Supabase no cuenta contra el límite de Vercel
- Ejemplo:
  ```typescript
  // ❌ Evitar - Genera invocación a Vercel
  const response = await fetch('/api/recordatorios');
  const data = await response.json();

  // ✅ Preferir - No genera invocación a Vercel
  const { data } = await supabase.from('recordatorios').select('*');
  ```

### 7. ErrorBoundaries en Dashboard
- **SIEMPRE** envolver componentes nuevos del dashboard con `ErrorBoundary`
- Importar desde: `@/components/error/error-boundary`
- Esto aisla errores y previene fallos en cascada
- Ejemplo:
  ```typescript
  import { ErrorBoundary } from '@/components/error/error-boundary';

  <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
    <MiNuevoComponente />
  </ErrorBoundary>
  ```

---

## 📦 Git Workflow

### 8. Commit Automático
- **DESPUÉS** de cada tarea completada, ejecutar automáticamente:
  ```bash
  git add -A
  git commit -m "tipo: descripción en español del cambio"
  git push origin main
  ```

- **Tipos de commit:**
  - `perf:` Optimizaciones de rendimiento
  - `fix:` Corrección de bugs
  - `feat:` Nueva funcionalidad
  - `refactor:` Refactorización sin cambio de funcionalidad
  - `style:` Cambios de formato/estilo
  - `docs:` Cambios en documentación
  - `test:` Añadir o actualizar tests
  - `chore:` Tareas de mantenimiento

- **Formato del mensaje:**
  ```
  tipo: descripción breve (máx 50 caracteres)

  - Cambio 1
  - Cambio 2
  - Cambio 3

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

---

## 📝 Proyectos Pendientes (PENDIENTES.md)

Consultar `PENDIENTES.md` antes de empezar nuevas tareas.
Prioridades actuales:
1. Tests Playwright (Fase 3)
2. Logging centralizado (Fase 3 - QUICK WIN)
3. Monitoring/analytics (Fase 3)
4. Favoritos/Marcadores (Fase 4)

---

## 🔒 Seguridad

- Validar TODOS los inputs con Zod
- Sanitizar strings con `sanitizeString()` de `@/lib/validation`
- Usar DOMPurify para contenido HTML
- No exponer secrets en el cliente
- Headers de seguridad ya configurados en `src/proxy.ts`

---

## 🧪 Testing

- Antes de hacer commit: `npm run build` debe pasar sin errores
- Tests E2E con Playwright pendientes (ver PENDIENTES.md)
- No romper funcionalidad existente sin aprobación explícita

---

## 🎨 Estilo de Código

- TypeScript estricto
- Componentes funcionales con hooks
- Zustand para estado global
- Supabase para base de datos
- Tailwind CSS para estilos
- Seguir convenciones existentes en el proyecto
