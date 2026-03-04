# 🚀 Plan de Migración: Google Sheets → Supabase

## 📋 Resumen Ejecutivo

| Aspecto | Valor |
|---------|-------|
| **Duración estimada** | 3-4 días (20-25 horas de trabajo) |
| **Riesgo** | Bajo - migración incremental sin breaking changes |
| **Enfoque** | Faseada: cada fase es funcional y testeable |
| **Bloqueo backend** | NO - backend viejo sigue funcionando mientras se migra |
| **Bloqueo frontend** | NO - cada página se migra individualmente |

---

## 🔄 Estrategia de Migración

### Principio clave: **Blue-Green Deployment**

```
┌─────────────────────────────────────────────────────────────┐
│  SEMÁFORO DE MIGRACIÓN                                      │
├─────────────────────────────────────────────────────────────┤
│  🔴 ROJO:     Sistema actual (n8n + Google Sheets)          │
│  🟢 VERDE:    Sistema nuevo (Supabase)                      │
│  🟡 AMARILLO: Ambos conviven (periodo de transición)        │
└─────────────────────────────────────────────────────────────┘
```

**Fases del semáforo:**
1. 🟡 **AMARILLO** (Fase 1-2): Ambos sistemas conviven, NO rompemos nada
2. 🟢 **VERDE** (Fase 3-10): Migramos página por página a Supabase
3. 🔴 **ROJO** (Fase 11): Eliminamos código antiguo de n8n

---

## 📅 CRONOGRAMA DETALLADO

## 🔵 FASE 1: Setup Supabase Client (2 horas)

**Objetivo:** Preparar infraestructura SIN tocar código existente

**Cambios en el código:**

### 1.1 Instalar dependencia
```bash
npm install @supabase/supabase-js
```

### 1.2 Crear `src/lib/supabase.ts` (NUEVO ARCHIVO)
```typescript
import { createClient } from '@supabase/supabase-js';

// Cliente público (solo lectura, para el browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (lectura + escritura, SOLO servidor)
// Importar esto solo en API routes, nunca en el cliente
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Tipos helper
export type Database = {
  public: {
    Tables: {
      compras: {
        Row: { /* ... */ };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // ... otras tablas
    };
    Views: {
      vista_gasto_por_tienda: { Row: { /* ... */ } };
      vista_resumen_mensual: { Row: { /* ... */ } };
      // ... otras vistas
    };
  };
};
```

### 1.3 Actualizar `.env.local`
```bash
# Agregar AL FINAL del archivo (sin borrar lo existente):
NEXT_PUBLIC_SUPABASE_URL=https://n8n-alejomartinez-supabase.aejhww.easypanel.host
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu anon key>
SUPABASE_SERVICE_ROLE_KEY=<tu service role key>
```

### 1.4 Actualizar `.env.example`
```bash
# Agregar:
NEXT_PUBLIC_SUPABASE_URL=https://n8n-alejomartinez-n8n.aejhww.easypanel.host
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Estado tras Fase 1:**
- ✅ Supabase client disponible
- ✅ Sistema sigue funcionando igual (sin cambios)
- ✅ Listo para crear nuevas APIs

**Qué hace n8n mientras tú haces esto:**
```
n8n: Preparar webhook para INSCRIPCIÓN de datos en Supabase
      (Esto será para FASE 8 - cuando recibamos nuevas compras)
```

---

## 🔵 FASE 2: Nueva API Route /api/compras (4 horas)

**Objetivo:** Crear API paralela que expone datos de Supabase

**Cambios en el código:**

### 2.1 Crear `src/app/api/compras/route.ts` (NUEVO ARCHIVO)

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface CompraRow {
  id: string;
  fecha: string;
  tienda: string;
  descripcion: string;
  precio_unitario: number;
  cantidad: number;
  total: number;
  telefono: string | null;
  direccion: string | null;
  restaurante_id: string | null;
  proveedor_id: string | null;
  created_at: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parámetros de query
  const restauranteId = searchParams.get('restaurante_id');
  const proveedorId = searchParams.get('proveedor_id');
  const tienda = searchParams.get('tienda');
  const producto = searchParams.get('producto');
  const fechaDesde = searchParams.get('fecha_desde');
  const fechaHasta = searchParams.get('fecha_hasta');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .from('compras')
      .select('*', { count: 'exact' })
      .order('fecha', { ascending: false });

    // Aplicar filtros
    if (restauranteId) query = query.eq('restaurante_id', restauranteId);
    if (proveedorId) query = query.eq('proveedor_id', proveedorId);
    if (tienda) query = query.ilike('tienda', `%${tienda}%`);
    if (producto) query = query.ilike('descripcion', `%${producto}%`);
    if (fechaDesde) query = query.gte('fecha', fechaDesde);
    if (fechaHasta) query = query.lte('fecha', fechaHasta);

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('Error en /api/compras:', error);
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    apiLogger.info(`Compras retornadas: ${data?.length || 0} de ${count || 0}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        offset,
        limit,
        has_more: (count || 0) > offset + limit
      },
      _source: 'supabase'
    });

  } catch (error) {
    apiLogger.error('Error inesperado en /api/compras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', success: false },
      { status: 500 }
    );
  }
}
```

### 2.2 Crear `src/app/api/proveedores/route.ts` (NUEVO ARCHIVO)

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');

  try {
    // Usar la vista que ya tiene todos los cálculos
    let query = supabase
      .from('vista_gasto_por_tienda')
      .select('*')
      .order('gasto_total', { ascending: false });

    if (restauranteId) {
      query = query.eq('restaurante_id', restauranteId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      _source: 'supabase'
    });

  } catch (error) {
    apiLogger.error('Error en /api/proveedores:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 2.3 Crear `src/app/api/precios/route.ts` (NUEVO ARCHIVO)

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');

  try {
    // Productos más costosos (vista pre-calculada)
    const { data: costosos, error: errorCostosos } = await supabase
      .from('vista_productos_costosos')
      .select('*')
      .order('gasto_total', { ascending: false })
      .limit(10);

    // Evolución de precios
    const { data: evolucion, error: errorEvolucion } = await supabase
      .from('vista_evolucion_precios')
      .select('*')
      .order('fecha', { ascending: false });

    // Gasto por categoría
    const { data: categorias, error: errorCategorias } = await supabase
      .from('vista_gasto_por_categoria')
      .select('*');

    if (errorCostosos || errorEvolucion || errorCategorias) {
      return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        productos_costosos: costosos || [],
        evolucion_precios: evolucion || [],
        gasto_por_categoria: categorias || []
      },
      _source: 'supabase'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 2.4 Crear `src/app/api/dashboard/route.ts` (NUEVO ARCHIVO)

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');
  const anio = parseInt(searchParams.get('anio') || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get('mes') || new Date().getMonth() + 1);

  try {
    // Resumen del mes actual
    const { data: resumen, error: errorResumen } = await supabase
      .from('vista_resumen_mensual')
      .select('*')
      .eq('anio', anio)
      .eq('mes', mes)
      .single();

    // Gasto por tienda del mes
    const { data: gastoTiendas, error: errorTiendas } = await supabase
      .from('vista_gasto_tienda_mensual')
      .select('*')
      .eq('anio', anio)
      .eq('mes', mes)
      .order('gasto_total', { ascending: false });

    // Comparación de periodos (últimos 30 días vs anteriores)
    const { data: comparacion, error: errorComparacion } = await supabase
      .rpc('comparar_periodos', {
        p_restaurante_id: restauranteId,
        p_dias: 30
      });

    if (errorResumen || errorTiendas) {
      return NextResponse.json({ error: 'Error obteniendo resumen' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        resumen: resumen || null,
        gasto_tiendas: gastoTiendas || [],
        comparacion: comparacion || []
      },
      _source: 'supabase'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

**Estado tras Fase 2:**
- ✅ Nuevas APIs creadas (NO rompen las existentes)
- ✅ `/api/compras` disponible con paginación real
- ✅ `/api/proveedores` usa vista pre-calculada
- ✅ `/api/precios` retorna datos estructurados
- ✅ `/api/dashboard` listo para el panel principal
- ✅ Sistema viejo sigue funcionando

**Cómo probar:**
```bash
# Test local
curl http://localhost:3000/api/compras?limit=10
curl http://localhost:3000/api/proveedores
curl http://localhost:3000/api/precios
```

**Qué hace n8n mientras tú haces esto:**
```
n8n: Crear webhook "Supabase - Nueva Compra"
      - Recibe POST con datos de compra
      - Inserta en tabla 'compras' de Supabase
      - (Este webhook se usará en FASE 8 para nuevas compras)
```

---

## 🟢 FASE 3: Migrar página registro/page.tsx (2 horas)

**Objetivo:** Primera página usando Supabase (la más simple)

**Cambios en el código:**

### 3.1 Modificar `src/app/registro/page.tsx`

**ANTES:**
```typescript
// Líneas 27-90
useEffect(() => {
  async function fetchDatos() {
    try {
      setCargando(true);
      setError(null);

      const result = await fetchWithCache(
        'sheets_data',
        async () => {
          const response = await fetch('/api/sheets');
          if (!response.ok) throw new Error('Error al obtener datos');
          return response.json();
        },
        3 // 3 minutos de caché
      );

      if (result.success && result.data.registro_diario?.values) {
        const values = result.data.registro_diario.values as string[][];
        // ... procesar arrays
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }
  fetchDatos();
}, []);
```

**DESPUÉS:**
```typescript
// Reemplazar useEffect completo
useEffect(() => {
  async function fetchDatos() {
    try {
      setCargando(true);
      setError(null);

      // Parámetros de query
      const params = new URLSearchParams({
        limit: ITEMS_POR_PAGINA.toString(),
        offset: ((pagina - 1) * ITEMS_POR_PAGINA).toString(),
      });

      if (filtroTienda !== 'todas') {
        params.append('tienda', filtroTienda);
      }

      if (busqueda) {
        params.append('producto', busqueda);
      }

      // Fetch a Supabase
      const response = await fetch(`/api/compras?${params}`);
      if (!response.ok) throw new Error('Error al obtener datos');

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      // Actualizar estado
      setCompras(result.data || []);

      // Actualizar conteo total (para paginación)
      setTotalCompras(result.pagination?.total || 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }
  fetchDatos();
}, [pagina, filtroTienda, busqueda]); // Refetch cuando cambian filtros o página

// Agregar nuevo estado
const [totalCompras, setTotalCompras] = useState(0);

// Actualizar lógica de paginación (líneas 116-120)
const totalPaginas = Math.ceil(totalCompras / ITEMS_POR_PAGINA);
const comprasPaginadas = compras; // Ya viene paginado del servidor
```

### 3.2 Actualizar búsqueda y filtros

**ANTES:**
```typescript
// Líneas 96-113: Filtrado en cliente
const comprasFiltradas = compras
  .filter(c => {
    const cumpleBusqueda = c.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                          c.tienda.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleTienda = filtroTienda === 'todas' || normalizarTienda(c.tienda) === filtroTienda;
    return cumpleBusqueda && cumpleTienda;
  })
  .sort((a, b) => { /* ... */ });
```

**DESPUÉS:**
```typescript
// Eliminar comprasFiltradas - ahora el servidor filtra
// El useEffect se re-ejecuta cuando cambian busqueda o filtroTienda

// Mantener solo el ordenamiento en cliente si se desea
const comprasOrdenadas = [...compras].sort((a, b) => {
  let aVal: Date | string | number, bVal: Date | string | number;
  switch (sortField) {
    case 'fecha': aVal = new Date(a.fecha); bVal = new Date(b.fecha); break;
    case 'tienda': aVal = normalizarTienda(a.tienda); bVal = normalizarTienda(b.tienda); break;
    case 'producto': aVal = a.producto; bVal = b.producto; break;
    case 'total': aVal = a.total; bVal = b.total; break;
  }
  if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
  return aVal < bVal ? 1 : -1;
});
```

### 3.3 Actualizar JSX para usar comprasOrdenadas

```typescript
// Línea 260: Reemplazar comprasPaginadas por comprasOrdenadas
{comprasOrdenadas.map((compra) => {
  // ... resto del código igual
})}
```

**Archivos modificados:** `src/app/registro/page.tsx`
**Líneas de código afectadas:** ~80 líneas
**Riesgo:** Bajo (página simple)

**Estado tras Fase 3:**
- ✅ Registro de compras usa Supabase
- ✅ Paginación real en servidor (más rápido)
- ✅ Búsqueda y filtros en servidor (más eficiente)
- ✅ Otras páginas siguen con n8n (sin cambios)

**Cómo probar:**
1. Ir a `/registro`
2. Verificar que aparecen compras
3. Probar búsqueda
4. Probeer filtros por tienda
5. Probar paginación
6. Verificar en DevTools Network que llama a `/api/compras`

**Qué hace n8n mientras tú haces esto:**
```
n8n: Crear flujo "Sincronización Histórica"
      - Lee todas las hojas de Google Sheets
      - Transforma al formato de Supabase
      - Inserta en tabla 'compras' (usando Supabase Node)
      - Este script se usará en FASE 9
```

---

## 🟢 FASE 4: Migrar página proveedores/page.tsx (2 horas)

**Objetivo:** Usar vista pre-calculada de Supabase

**Cambios en el código:**

### 4.1 Modificar `src/app/proveedores/page.tsx`

**ANTES:**
```typescript
// Líneas 33-92: useEffect que obtiene y procesa datos
useEffect(() => {
  async function fetchDatos() {
    try {
      const result = await fetchWithCache('sheets_data', async () => {
        const response = await fetch('/api/sheets');
        return response.json();
      }, 3);

      if (result.success && result.data.base_de_datos?.values) {
        const values = result.data.base_de_datos.values as string[][];
        // ... procesar y agrupar por tienda
      }
    } catch (err) {
      // ...
    }
  }
  fetchDatos();
}, []);
```

**DESPUÉS:**
```typescript
// Reemplazar useEffect completo
useEffect(() => {
  async function fetchDatos() {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch('/api/proveedores');
      if (!response.ok) throw new Error('Error al obtener datos');

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      setInfoTiendas(result.data || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }
  fetchDatos();
}, []);

// Eliminar useMemo de infoTiendas (líneas 93-143)
// Ya no necesita procesamiento - viene listo de Supabase

// Actualizar tipo de dato
interface InfoTienda {
  tienda: string;
  restaurante_id?: string;
  total_compras: number;
  productos_unicos: number;
  gasto_total: number;
  precio_promedio: number;
  primera_compra: string;
  ultima_compra: string;
}
```

### 4.2 Actualizar referencias en el JSX

```typescript
// Actualizar propiedades para que coincidan con la vista de Supabase

// Línea 129: nombre → tienda
<h3 className="text-lg font-bold text-white">{tienda.tienda}</h3>

// Línea 132: numCompras → total_compras
<p className="text-sm text-muted-foreground">{tienda.total_compras} compras realizadas</p>

// Línea 145: totalGastado → gasto_total
<p className="text-2xl font-bold text-chart-1">{formatearMoneda(tienda.gasto_total)}</p>

// Línea 154: totalGastado → gasto_total
<p className="text-2xl font-bold text-chart-2">{formatearMoneda(tienda.gasto_total)}</p>

// Línea 269: nombre → tienda
{infoTiendas.map((tienda) => (
  <Card key={tienda.tienda} className="...">
    <h3 className="text-lg font-bold text-white">{tienda.tienda}</h3>
    // ... resto del código
))}
```

### 4.3 Eliminar lógica de productosTop (opcional)

La vista de Supabase no tiene productos top, así que puedes:
1. Ocultar esa sección temporalmente, o
2. Crear un endpoint separado para productos por tienda

```typescript
// Opción 1: Ocultar sección (líneas 338-357)
{/* Productos top - COMENTADO TEMPORALMENTE
<div>
  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Productos Más Comprados</p>
  // ...
</div>
*/}
```

**Archivos modificados:** `src/app/proveedores/page.tsx`
**Líneas de código afectadas:** ~100 líneas
**Riesgo:** Bajo

**Estado tras Fase 4:**
- ✅ Proveedores usa vista de Supabase
- ✅ Sin procesamiento en cliente
- ✅ Más rápido (cálculos pre-hechos en BD)

**Cómo probar:**
1. Ir a `/proveedores`
2. Verificar que aparecen tiendas
3. Verificar que los totales son correctos

**Qué hace n8n mientras tú haces esto:**
```
n8n: Preparar webhook "Proveedores - Sincronizar"
      - Obtendrá lista de proveedores de Supabase
      - Los mantendrá sincronizados con Sheets (si aún lo necesitas)
```

---

## 🟢 FASE 5: Migrar página precios/page.tsx (3 horas)

**Objetivo:** Usar vistas de evolución de precios y productos costosos

**Cambios en el código:**

### 5.1 Modificar `src/app/precios/page.tsx`

**ANTES:**
```typescript
// Líneas 32-93: useEffect con procesamiento complejo
useEffect(() => {
  async function fetchDatos() {
    try {
      const result = await fetchWithCache('sheets_data', async () => {
        const response = await fetch('/api/sheets');
        return response.json();
      }, 3);

      if (result.success && result.data.base_de_datos?.values) {
        // ... procesamiento para calcular precios, variaciones, etc.
      }
    } catch (err) {
      // ...
    }
  }
  fetchDatos();
}, []);
```

**DESPUÉS:**
```typescript
// Reemplazar useEffect completo
useEffect(() => {
  async function fetchDatos() {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch('/api/precios');
      if (!response.ok) throw new Error('Error al obtener datos');

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      // Setear datos directamente de la API
      setProductosCostosos(result.data.productos_costosos || []);
      setEvolucionPrecios(result.data.evolucion_precios || []);
      setCategorias(result.data.gasto_por_categoria || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }
  fetchDatos();
}, []);

// Nuevos estados
const [productosCostosos, setProductosCostosos] = useState<any[]>([]);
const [evolucionPrecios, setEvolucionPrecios] = useState<any[]>([]);
const [categorias, setCategorias] = useState<any[]>([]);
```

### 5.2 Eliminar useMemo de preciosProductos

Eliminar líneas 95-134 (el useMemo que calcula precios).

### 5.3 Actualizar datos de gráficos

**ANTES:**
```typescript
// Líneas 139-213: useMemo para datosGraficoEvolucion
const datosGraficoEvolucion = useMemo(() => {
  // ... lógica compleja para agrupar por quincenas
}, [compras]);
```

**DESPUÉS:**
```typescript
// Simplificar - usar datos de evolucion_precios
const datosGraficoEvolucion = useMemo(() => {
  return evolucionPrecios
    .filter(e => e.variacion_porcentaje !== null) // Solo mostrar cambios
    .map(e => ({
      producto: e.producto,
      precio: e.precio,
      variacion: e.variacion_porcentaje,
      fecha: new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    }))
    .slice(0, 50); // Últimos 50 cambios
}, [evolucionPrecios]);
```

### 5.4 Actualizar KPIs

```typescript
// Líneas 268-292: Actualizar KPIs
<Card className="p-4 bg-card border-border">
  <p className="text-muted-foreground text-sm mb-1">Productos Analizados</p>
  <p className="text-2xl font-bold text-white">{productosCostosos.length}</p>
</Card>

<Card className="p-4 bg-card border-border">
  <p className="text-muted-foreground text-sm mb-1">Precio Promedio</p>
  <p className="text-2xl font-bold text-[#10b981]">
    {formatearMoneda(
      productosCostosos.length > 0
        ? productosCostosos.reduce((sum, p) => sum + (p.precio_promedio || 0), 0) / productosCostosos.length
        : 0
    )}
  </p>
</Card>

<Card className="p-4 bg-card border-border">
  <p className="text-muted-foreground text-sm mb-1">Producto Más Costoso</p>
  <p className="text-lg font-bold text-[#3b82f6] truncate">
    {productosCostosos[0]?.producto || '-'}
  </p>
  <p className="text-xs text-muted-foreground">{formatearMoneda(productosCostosos[0]?.precio_maximo || 0)}</p>
</Card>
```

**Archivos modificados:** `src/app/precios/page.tsx`
**Líneas de código afectadas:** ~150 líneas
**Riesgo:** Medio (más lógica que otras páginas)

**Estado tras Fase 5:**
- ✅ Precios usa vistas de Supabase
- ✅ Sin cálculos en cliente
- ✅ Evolución de precios en tiempo real

**Cómo probar:**
1. Ir a `/precios`
2. Verificar KPIs
3. Verificar tabla de productos
4. Verificar gráficos

**Qué hace n8n mientras tú haces esto:**
```
n8n: Crear trigger en Supabase (si usas Supabase real)
      - Trigger INSERT en tabla 'compras'
      - Llama a webhook de n8n
      - n8n inserta en 'precios_historico'
```

---

## 🟢 FASE 6: Migrar página facturas/page.tsx (2 horas)

**Objetivo:** Usar tabla de facturas de Supabase

**Cambios en el código:**

### 6.1 Crear `src/app/api/facturas/route.ts` (NUEVO)

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Obtener facturas con sus compras
    const { data: facturas, error } = await supabase
      .from('facturas')
      .select(`
        *,
        compras (
          id,
          descripcion,
          cantidad,
          precio_unitario,
          total
        )
      `)
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: facturas || [],
      _source: 'supabase'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 6.2 Modificar `src/app/facturas/page.tsx`

**ANTES:**
```typescript
// Líneas 30-79: useEffect con agrupación por factura
useEffect(() => {
  async function fetchDatos() {
    try {
      const result = await fetchWithCache('sheets_data', async () => {
        const response = await fetch('/api/sheets');
        return response.json();
      }, 3);

      if (result.success && result.data.base_de_datos?.values) {
        // ... procesar y agrupar compras por factura
      }
    } catch (err) {
      // ...
    }
  }
  fetchDatos();
}, []);
```

**DESPUÉS:**
```typescript
// Reemplazar useEffect completo
useEffect(() => {
  async function fetchDatos() {
    try {
      setCargando(true);
      setError(null);

      const response = await fetch('/api/facturas');
      if (!response.ok) throw new Error('Error al obtener datos');

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      setFacturas(result.data || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setCargando(false);
    }
  }
  fetchDatos();
}, []);

// Actualizar tipo
interface FacturaConDetalle {
  id: string;
  fecha: string;
  tienda: string;
  total: number;
  num_productos: number;
  imagen_url?: string;
  nombre_archivo?: string;
  restaurante_id?: string;
  compras: Compra[];
}

const [facturas, setFacturas] = useState<FacturaConDetalle[]>([]);
```

### 6.3 Eliminar función agruparPorFactura

Eliminar línea 82 donde se usa `agruparPorFactura`. Ya no es necesaria.

**Archivos modificados:**
- `src/app/facturas/page.tsx`
- `src/app/api/facturas/route.ts` (NUEVO)
**Líneas de código afectadas:** ~80 líneas
**Riesgo:** Bajo

**Estado tras Fase 6:**
- ✅ Facturas usa tabla de Supabase
- ✅ Relación con compras automática
- ✅ Sin agrupación en cliente

**Cómo probar:**
1. Ir a `/facturas`
2. Verificar que aparecen facturas
3. Expandir una factura y ver sus productos

**Qué hace n8n mientras tú haces esto:**
```
n8n: Crear webhook "OCR - Procesar Factura"
      - Recibe imagen de factura
      - Procesa con OCR
      - Inserta en 'facturas' y 'compras' de Supabase
```

---

## 🟢 FASE 7: Migrar dashboard/page.tsx (3 horas)

**Objetivo:** Usar vistas de resumen mensual

**Cambios en el código:**

### 7.1 Modificar `src/app/dashboard/page.tsx`

**ANTES:**
```typescript
// Líneas que hacen fetch a /api/sheets
const result = await fetchWithCache('sheets_data', async () => {
  const response = await fetch('/api/sheets');
  return response.json();
}, 3);
```

**DESPUÉS:**
```typescript
// Reemplazar por fetch a /api/dashboard
const response = await fetch('/api/dashboard');
if (!response.ok) throw new Error('Error al obtener datos');

const result = await response.json();

if (!result.success) {
  throw new Error(result.error || 'Error desconocido');
}

// Extraer datos
const resumen = result.data.resumen;
const gastoTiendas = result.data.gasto_tiendas;
const comparacion = result.data.comparacion;
```

### 7.2 Actualizar todas las referencias a datos

Buscar y reemplazar todas las variables según los nuevos nombres de la vista de Supabase.

**Archivos modificados:** `src/app/dashboard/page.tsx`
**Líneas de código afectadas:** ~200 líneas
**Riesgo:** Medio (página compleja)

**Estado tras Fase 7:**
- ✅ Dashboard usa Supabase
- ✅ KPIs en tiempo real
- ✅ Comparativas de periodos

**Cómo probar:**
1. Ir a `/dashboard`
2. Verificar todos los KPIs
3. Verificar gráficos
4. Verificar comparativas

**Qué hace n8n mientras tú haces esto:**
```
n8n: Limpiar flujos antiguos
      - Archivar flujos que ya no se usan
      - Mantener solo lo necesario para la migración
```

---

## 🟢 FASE 8: Migrar sistema de recordatorios (2 horas)

**Objetivo:** Insertar recordatorios directamente en Supabase

**Cambios en el código:**

### 8.1 Crear `src/app/api/recordatorios/route.ts` (NUEVO)

```typescript
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Obtener recordatorios
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');

  try {
    let query = supabaseAdmin
      .from('recordatorios')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (restauranteId) {
      query = query.eq('restaurante_id', restauranteId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Crear recordatorio
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { producto, dias, notas, restaurante_id } = body;

    const { data, error } = await supabaseAdmin
      .from('recordatorios')
      .insert({
        producto,
        dias: parseInt(dias),
        notas,
        restaurante_id,
        activo: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Desactivar recordatorio
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('recordatorios')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### 8.2 Modificar `src/components/dashboard/recordatorios.tsx`

Actualizar para usar nueva API de Supabase.

**Archivos modificados:**
- `src/app/api/recordatorios/route.ts` (NUEVO)
- `src/components/dashboard/recordatorios.tsx`
**Líneas de código afectadas:** ~100 líneas
**Riesgo:** Bajo

**Estado tras Fase 8:**
- ✅ Recordatorios en Supabase
- ✅ Crear/eliminar funcional
- ✅ Multi-restaurante

**Qué hace n8n mientras tú haces esto:**
```
n8n: Crear job programado "Verificar Recordatorios"
      - Se ejecuta cada hora
      - Consulta 'recordatorios' en Supabase
      - Genera alertas si es necesario
      - Inserta en tabla 'alertas'
```

---

## 🟡 FASE 9: Migrar datos desde Google Sheets (3 horas)

**Objetivo:** Pasar todos los datos históricos a Supabase

**Cambios en el código:**

### 9.1 Crear `scripts/migrate-to-supabase.ts` (NUEVO)

```typescript
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuración
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CompraSheets {
  FECHA: string;
  TIENDA: string;
  DESCRIPCION: string;
  CANTIDAD: string;
  'PRECIO UNITARIO': string;
  TOTAL: string;
  TELEFONO?: string;
  DIRECCION?: string;
}

async function migrateCompras() {
  console.log('🚀 Iniciando migración de compras...');

  // 1. Obtener datos de Google Sheets vía n8n
  console.log('📥 Obteniendo datos de Google Sheets...');
  const response = await fetch(N8N_WEBHOOK_URL);
  const sheetsData = await response.json();

  if (!sheetsData.success || !sheetsData.data?.base_de_datos?.values) {
    throw new Error('Error obteniendo datos de Sheets');
  }

  const rows = sheetsData.data.base_de_datos.values as string[][];
  const headers = rows[0];
  const dataRows = rows.slice(1);

  console.log(`✅ ${dataRows.length} filas obtenidas`);

  // 2. Transformar datos
  console.log('🔄 Transformando datos...');
  const compras = dataRows.map((row, index) => {
    const obj: Partial<CompraSheets> = {};
    headers.forEach((header, i) => {
      obj[header as keyof CompraSheets] = row[i];
    });

    return {
      fecha: obj.FECHA,
      tienda: obj.TIENDA,
      descripcion: obj.DESCRIPCION,
      cantidad: parseFloat(obj.CANTIDAD) || 1,
      precio_unitario: parseFloat(obj['PRECIO UNITARIO']) || 0,
      total: parseFloat(obj.TOTAL) || 0,
      telefono: obj.TELEFONO || null,
      direccion: obj.DIRECCION || null,
      // restaurante_id se queda null por ahora
      // proveedor_id se qued a null por ahora
    };
  });

  // 3. Insertar en Supabase (en batches de 100)
  console.log('💾 Insertando en Supabase...');
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < compras.length; i += BATCH_SIZE) {
    const batch = compras.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('compras')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error insertando batch ${i}-${i + BATCH_SIZE}:`, error.message);
      errors++;
    } else {
      inserted += data?.length || 0;
      console.log(`✅ Insertados ${data?.length || 0} registros (${inserted}/${compras.length})`);
    }
  }

  console.log(`\n📊 RESUMEN:`);
  console.log(`   ✅ Insertados: ${inserted}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   📦 Total: ${compras.length}`);
}

async function migrateProveedores() {
  console.log('\n🚀 Iniciando migración de proveedores...');

  // Obtener compras para extraer proveedores únicos
  const { data: compras, error } = await supabase
    .from('compras')
    .select('tienda, telefono, direccion')
    .not('tienda', 'is', null);

  if (error) {
    console.error('Error obteniendo compras:', error);
    return;
  }

  // Extraer proveedores únicos
  const proveedoresUnicos = new Map<string, any>();

  compras.forEach(compra => {
    const key = compra.tienda.toLowerCase().trim();
    if (!proveedoresUnicos.has(key)) {
      proveedoresUnicos.set(key, {
        nombre: compra.tienda,
        nombre_normalizado: key,
        telefono: compra.telefono,
        direccion: compra.direccion
      });
    }
  });

  console.log(`📊 ${proveedoresUnicos.size} proveedores únicos encontrados`);

  // Insertar proveedores
  const proveedores = Array.from(proveedoresUnicos.values());

  const { data, error: insertError } = await supabase
    .from('proveedores')
    .insert(proveedores)
    .select();

  if (insertError) {
    console.error('Error insertando proveedores:', insertError);
  } else {
    console.log(`✅ ${data?.length || 0} proveedores insertados`);
  }
}

async function main() {
  try {
    await migrateCompras();
    await migrateProveedores();

    console.log('\n✅ Migración completada exitosamente!');
    console.log('🔍 Verifica los datos en Supabase');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

main();
```

### 9.2 Ejecutar script

```bash
# Asegurarse de tener las variables de entorno
cp .env.local .env

# Ejecutar script
npx tsx scripts/migrate-to-supabase.ts
```

**Archivos creados:**
- `scripts/migrate-to-supabase.ts` (NUEVO)
**Riesgo:** Medio (operación de escritura en BD)

**Estado tras Fase 9:**
- ✅ Todos los datos históricos en Supabase
- ✅ Proveedores migrados
- ✅ Listo para producción

**Qué hace n8n mientras tú haces esto:**
```
n8n: Nada - el script se conecta directamente a Supabase
```

---

## 🟢 FASE 10: Testing y Cleanup (4 horas)

**Objetivo:** Verificar que todo funciona y limpiar código antiguo

### 10.1 Checklist de Testing

```
Frontend:
□ /dashboard - Todos los KPIs se muestran correctamente
□ /registro - Paginación, búsqueda, filtros funcionan
□ /proveedores - Lista de proveedores se muestra
□ /precios - Gráficos y tablas funcionan
□ /facturas - Facturas con productos se expanden
□ /settings - Configuración funciona

Backend:
□ /api/compras - Retorna datos correctos
□ /api/proveedores - Retorna datos correctos
□ /api/precios - Retorna datos correctos
□ /api/dashboard - Retorna datos correctos
□ /api/facturas - Retorna datos correctos
□ /api/recordatorios - GET/POST/DELETE funcionan

Datos:
□ Todas las compras migradas
□ Proveedores migrados
□ Totales coinciden con Sheets original

Performance:
□ Tiempo de carga < 2 segundos
□ Paginación fluida
□ Sin errores en consola
```

### 10.2 Eliminar código antiguo

```typescript
// ELIMINAR (cuando estés seguro):
// - src/app/api/sheets/route.ts (o archivar como .disabled)
// - fetchWithCache de páginas que ya no lo usan
// - funciones de procesamiento de arrays
// - comentarios de código antiguo

// ARCHIVAR (mantener por seguridad):
// - .env.example (actualizar)
// - PENDIENTES.md (actualizar estado)
```

### 10.3 Actualizar documentación

```markdown
# README.md

## Arquitectura

- **Frontend:** Next.js 16 + React 19
- **Backend:** Next.js API Routes
- **Base de Datos:** Supabase (PostgreSQL)
- **Hosting:** Vercel

## Variables de Entorno

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Estructura de Base de Datos

Ver esquema en: SUPABASE_SCHEMA.md
```

**Archivos modificados:** Múltiples
**Riesgo:** Bajo (solo eliminas código que ya no se usa)

**Estado tras Fase 10:**
- ✅ Sistema completamente migrado
- ✅ Código limpio
- ✅ Documentación actualizada
- ✅ Listo para producción

---

## 📊 RESUMEN DE CAMBIOS POR FASE

| Fase | Archivos Modificados | Archivos Creados | Líneas de Código | Tiempo |
|------|---------------------|------------------|------------------|--------|
| 1. Setup | `src/lib/supabase.ts` (nuevo) | 1 | 50 | 2h |
| 2. API | - | 4 nuevas API routes | 400 | 4h |
| 3. Registro | `src/app/registro/page.tsx` | - | 80 | 2h |
| 4. Proveedores | `src/app/proveedores/page.tsx` | - | 100 | 2h |
| 5. Precios | `src/app/precios/page.tsx` | - | 150 | 3h |
| 6. Facturas | `src/app/facturas/page.tsx` + API | 1 | 80 | 2h |
| 7. Dashboard | `src/app/dashboard/page.tsx` | - | 200 | 3h |
| 8. Recordatorios | Componente + API | 1 | 100 | 2h |
| 9. Migración datos | - | 1 script | 150 | 3h |
| 10. Testing | Varios | - | - | 4h |
| **TOTAL** | **7 archivos** | **8 archivos** | **~1,310 líneas** | **27h** |

---

## 🔄 PARALELO: TÚ (CÓDIGO) vs n8n (FLUJOS)

```
┌────────────────────────────────────────────────────────────────┐
│  CRONOGRAMA PARALELO                                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  DÍA 1-2: Setup + APIs                                        │
│  ├─ TÚ:        Fase 1-2 (Setup Supabase + APIs nuevas)       │
│  └─ n8n:      Preparar webhooks para inserción de datos       │
│                                                                │
│  DÍA 3: Migración Frontend (Parte 1)                          │
│  ├─ TÚ:        Fase 3-4 (Registro + Proveedores)             │
│  └─ n8n:      Crear flujo de sincronización histórica         │
│                                                                │
│  DÍA 4: Migración Frontend (Parte 2)                          │
│  ├─ TÚ:        Fase 5-6 (Precios + Facturas)                 │
│  └─ n8n:      Preparar webhook de OCR para facturas           │
│                                                                │
│  DÍA 5: Migración Frontend (Parte 3)                          │
│  ├─ TÚ:        Fase 7-8 (Dashboard + Recordatorios)          │
│  └─ n8n:      Crear job de verificación de recordatorios     │
│                                                                │
│  DÍA 6: Migración Datos + Testing                             │
│  ├─ TÚ:        Fase 9-10 (Script migración + testing)        │
│  └─ n8n:      Limpiar flujos antiguos, archivar               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### HOY: Comenzar Fase 1

```bash
# 1. Instalar dependencia
npm install @supabase/supabase-js

# 2. Crear archivo de lib
# (yo creo src/lib/supabase.ts)

# 3. Configurar variables de entorno
# (tú agregas las keys en .env.local y en Vercel)

# 4. Probar conexión
# (yo creo un endpoint de test)
```

### TÚ (n8n): Mientras trabajo en Fase 1-2

```
n8n Workflow: "Supabase - Nueva Compra"
├─ Trigger: Webhook (POST)
├─ Input: JSON con datos de compra
│  {
│    "fecha": "2026-03-04",
│    "tienda": "Carrefour",
│    "descripcion": "Tomates",
│    "cantidad": 5,
│    "precio_unitario": 2.50,
│    "total": 12.50,
│    "telefono": "933456789",
│    "direccion": "Av. Principal 123"
│  }
├─ Supabase Node: Insert en tabla 'compras'
└─ Response: { success: true, data: { ... } }

Webhook URL: https://n8n-alejomartinez-n8n.aejhww.easypanel.host/webhook/supabase-nueva-compra
```

---

## ✅ CONFIRMACIÓN

¿Empezamos con la **FASE 1** ahora?

1. Yo creo `src/lib/supabase.ts`
2. Instalo la dependencia
3. Te digo qué variables agregar a `.env.local`
4. Creo un endpoint de prueba para verificar conexión

**Confirmar y comienzo.** 👨‍💻
