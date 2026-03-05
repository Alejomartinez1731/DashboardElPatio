'use client';
import { generalLogger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { normalizarTienda, COLORES_TIENDA } from '@/lib/data-utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { InflacionKPI } from '@/components/dashboard/kpis-avanzados';

interface ProductoCostoso {
  producto: string;
  tienda: string;
  restaurante_id: string | null;
  precio_maximo: number;
  precio_minimo: number;
  precio_promedio: number;
  gasto_total: number;
  veces_comprado: number;
  ultima_compra: string;
}

interface EvolucionPrecio {
  producto: string;
  tienda: string;
  precio: number;
  precio_anterior: number | null;
  variacion_porcentaje: number | null;
  fecha: string;
  restaurante_id: string | null;
}

interface GastoCategoria {
  restaurante_id: string | null;
  categoria: string;
  total_items: number;
  gasto_total: number;
  precio_promedio: number;
}

interface InflacionData {
  variacion_promedio: number;
  productos_con_aumento: number;
  productos_analizados: number;
  productos_top_inflacion: Array<{
    producto: string;
    variacion_porcentaje: number;
    precio_actual: number;
    precio_anterior: number;
  }>;
}

export default function PreciosPage() {
  const [productosCostosos, setProductosCostosos] = useState<ProductoCostoso[]>([]);
  const [evolucionPrecios, setEvolucionPrecios] = useState<EvolucionPrecio[]>([]);
  const [categorias, setCategorias] = useState<GastoCategoria[]>([]);
  const [inflacionData, setInflacionData] = useState<InflacionData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatos() {
      try {
        // Cargar datos principales
        const response = await fetch('/api/precios');
        if (!response.ok) throw new Error('Error al obtener datos');

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Error desconocido');
        }

        setProductosCostosos(result.data.productos_costosos || []);
        setEvolucionPrecios(result.data.evolucion_precios || []);
        setCategorias(result.data.gasto_por_categoria || []);

        // Cargar KPI de inflación
        const kpisResponse = await fetch('/api/kpis-avanzados');
        const kpisResult = await kpisResponse.json();

        if (kpisResult.success && kpisResult.data?.inflacion) {
          setInflacionData(kpisResult.data.inflacion);
        }

      } catch (err) {
        generalLogger.error('Error en precios:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    }
    fetchDatos();
  }, []);

  // Top 10 productos más comprados
  const topProductos = productosCostosos.slice(0, 10);

  // Datos para gráfico de evolución de precios
  const datosGraficoEvolucion = evolucionPrecios
    .filter(e => e.variacion_porcentaje !== null)
    .slice(0, 50)
    .map(e => ({
      fecha: new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      precio: e.precio,
      variacion: e.variacion_porcentaje || 0,
      producto: e.producto
    }));

  // Distribución por rango de precios (calculado en cliente)
  const distribucionPrecios = productosCostosos.reduce((acc, p) => {
    if (p.precio_promedio < 1) acc['0-1€']++;
    else if (p.precio_promedio < 5) acc['1-5€']++;
    else if (p.precio_promedio < 10) acc['5-10€']++;
    else if (p.precio_promedio < 20) acc['10-20€']++;
    else acc['+20€']++;
    return acc;
  }, { '0-1€': 0, '1-5€': 0, '5-10€': 0, '10-20€': 0, '+20€': 0 } as Record<string, number>);

  const datosGraficoBarras = Object.entries(distribucionPrecios).map(([rango, cantidad]) => ({ rango, cantidad }));

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando análisis de precios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-6 text-center">
        <p className="text-[#ef4444] mb-2">Error al cargar datos</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Análisis de Precios</h1>
        <p className="text-muted-foreground">Evolución y variaciones de precios por producto</p>
      </div>

      {/* KPIs */}
      <div className="space-y-4">
        {/* KPI de Inflación - Nueva integración */}
        {inflacionData && (
          <InflacionKPI
            variacion_promedio={inflacionData.variacion_promedio}
            productos_con_aumento={inflacionData.productos_con_aumento}
            productos_analizados={inflacionData.productos_analizados}
            productos_top_inflacion={inflacionData.productos_top_inflacion}
          />
        )}

        {/* KPIs tradicionales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card border-border">
            <p className="text-muted-foreground text-sm mb-1">Productos Analizados</p>
            <p className="text-2xl font-bold text-white">{productosCostosos.length}</p>
          </Card>
          <Card className="p-4 bg-card border-border">
            <p className="text-muted-foreground text-sm mb-1">Precio Promedio</p>
            <p className="text-2xl font-bold text-[#10b981]">
              {formatearMoneda(productosCostosos.length > 0 ? productosCostosos.reduce((sum, p) => sum + p.precio_promedio, 0) / productosCostosos.length : 0)}
            </p>
          </Card>
          <Card className="p-4 bg-card border-border">
            <p className="text-muted-foreground text-sm mb-1">Total Compras</p>
            <p className="text-2xl font-bold text-[#f59e0b]">
              {productosCostosos.reduce((sum, p) => sum + p.veces_comprado, 0)}
            </p>
          </Card>
          <Card className="p-4 bg-card border-border">
            <p className="text-muted-foreground text-sm mb-1">Producto Más Comprado</p>
            <p className="text-lg font-bold text-[#3b82f6] truncate">
              {topProductos[0]?.producto || '-'}
            </p>
            <p className="text-xs text-muted-foreground">{topProductos[0]?.veces_comprado || 0} veces</p>
          </Card>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de precios */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Evolución de Precios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={datosGraficoEvolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="fecha" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(valor: number | undefined) => [formatearMoneda(valor || 0), 'Precio']}
              />
              <Area
                type="monotone"
                dataKey="precio"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribución por rango de precios */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Rango de Precios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGraficoBarras}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="rango" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="cantidad" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabla de productos más comprados */}
      <Card className="overflow-hidden bg-card border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#10b981]" />
            <h3 className="text-lg font-semibold text-white">Productos Más Comprados</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Ranking por gasto total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Veces Comprado</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Gasto Total</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Precio Prom</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Última Compra</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.map((p, index) => (
                <tr key={p.producto} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm text-white font-bold">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">{p.producto}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-semibold">
                      {p.veces_comprado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#10b981] font-semibold">{formatearMoneda(p.gasto_total)}</td>
                  <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatearMoneda(p.precio_promedio)}</td>
                  <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatearFecha(new Date(p.ultima_compra))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
