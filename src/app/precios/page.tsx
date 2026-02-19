'use client';

import { useEffect, useState } from 'react';
import { Compra } from '@/types';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { normalizarTienda, COLORES_TIENDA, normalizarFecha } from '@/lib/data-utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';

function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) return isNaN(fecha.getTime()) ? new Date() : fecha;
  if (!fecha || typeof fecha !== 'string') return new Date();

  if (fecha.includes('/')) {
    const partes = fecha.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(p => parseInt(p.trim(), 10));
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
        return new Date(anio, mes - 1, dia);
      }
    }
  }

  const parsed = new Date(fecha);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

interface PrecioProducto {
  producto: string;
  precioPromedio: number;
  precioMin: number;
  precioMax: number;
  variacion: number;
  numCompras: number;
  gastoTotal: number;
  historial: { fecha: Date; precio: number; tienda: string }[];
}

export default function PreciosPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function fetchDatos() {
      try {
        const response = await fetch('/api/sheets');
        const result = await response.json();
        if (result.success && result.data.base_de_datos?.values) {
          const values = result.data.base_de_datos.values as any[][];
          console.log('📊 Precios - Datos recibidos:', values.length, 'filas');

          if (values.length > 1) {
            const cabeceras = values[0].map((h: string) => h.toLowerCase().trim());
            console.log('📊 Precios - Cabeceras:', cabeceras);
            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};
              cabeceras.forEach((cab: string, idx: number) => { obj[cab] = fila[idx]; });

              // Buscar precio unitario en diferentes nombres posibles
              const precioRaw = obj.totalunitario || obj['precio unitario'] || obj['precio_unitario'] || obj.precio || '0';

              const compra: Compra = {
                id: `compra-${i}`,
                fecha: parsearFecha(obj.fecha || ''),
                tienda: obj.tienda || '',
                producto: obj.descripcion || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(precioRaw) || 0,
                total: parseFloat(obj.total || '0') || 0,
              };

              if (compra.producto && !compra.producto.toLowerCase().includes('total')) {
                comprasProcesadas.push(compra);
              }
            }
            console.log('✅ Precios - Compras procesadas:', comprasProcesadas.length);
            setCompras(comprasProcesadas);
          }
        }
      } catch (err) {
        console.error('Error en precios:', err);
      } finally {
        setCargando(false);
      }
    }
    fetchDatos();
  }, []);

  // Analizar evolución de precios y frecuencia de compras por producto
  const preciosProductos = useMemo(() => {
    const productos: Record<string, { compras: Compra[]; precios: number[] }> = {};

    compras.forEach(compra => {
      const key = compra.producto.toLowerCase().trim();
      if (!productos[key]) {
        productos[key] = { compras: [], precios: [] };
      }
      productos[key].compras.push(compra);
      productos[key].precios.push(compra.precioUnitario);
    });

    return Object.entries(productos).map(([producto, data]) => {
      const precios = data.precios;
      const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length;
      const precioMin = Math.min(...precios);
      const precioMax = Math.max(...precios);
      const numCompras = data.compras.length;
      const gastoTotal = data.compras.reduce((sum, c) => sum + c.total, 0);
      const primeraCompra = data.compras.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())[0];
      const ultimaCompra = data.compras.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];
      const variacion = primeraCompra.precioUnitario > 0
        ? ((ultimaCompra.precioUnitario - primeraCompra.precioUnitario) / primeraCompra.precioUnitario) * 100
        : 0;

      return {
        producto,
        precioPromedio,
        precioMin,
        precioMax,
        variacion,
        numCompras,
        gastoTotal,
        historial: data.compras
          .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
          .map(c => ({ fecha: c.fecha, precio: c.precioUnitario, tienda: normalizarTienda(c.tienda) })),
      } as PrecioProducto & { numCompras: number; gastoTotal: number };
    }).sort((a, b) => (b as any).numCompras - (a as any).numCompras); // Ordenar por número de compras
  }, [compras]);

  // Top 10 productos más comprados
  const topProductos = preciosProductos.slice(0, 10);

  // Datos para gráfico de evolución de precios (top 5 productos)
  const datosGraficoEvolucion = useMemo(() => {
    const top5 = preciosProductos.slice(0, 5);
    if (top5.length === 0) return [];

    // Agrupar por fecha
    const fechasUnicas = new Set<Date>();
    top5.forEach(p => p.historial.forEach(h => fechasUnicas.add(h.fecha)));
    const fechasOrdenadas = Array.from(fechasUnicas).sort((a, b) => a.getTime() - b.getTime());

    return fechasOrdenadas.map(fecha => {
      const data: any = { fecha: formatearFecha(fecha) };
      top5.forEach(p => {
        const historialEnFecha = p.historial.filter(h => h.fecha.getTime() === fecha.getTime());
        if (historialEnFecha.length > 0) {
          data[p.producto] = historialEnFecha[0].precio;
        }
      });
      return data;
    });
  }, [preciosProductos]);

  // Distribución por rango de precios
  const distribucionPrecios = useMemo(() => {
    const rangos = {
      '0-1€': 0,
      '1-5€': 0,
      '5-10€': 0,
      '10-20€': 0,
      '+20€': 0,
    };

    compras.forEach(c => {
      if (c.precioUnitario < 1) rangos['0-1€']++;
      else if (c.precioUnitario < 5) rangos['1-5€']++;
      else if (c.precioUnitario < 10) rangos['5-10€']++;
      else if (c.precioUnitario < 20) rangos['10-20€']++;
      else rangos['+20€']++;
    });

    return Object.entries(rangos).map(([rango, cantidad]) => ({ rango, cantidad }));
  }, [compras]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#f59e0b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Análisis de Precios</h1>
        <p className="text-[#94a3b8]">Evolución y variaciones de precios por producto</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#111827] border-[#1e293b]">
          <p className="text-[#64748b] text-sm mb-1">Productos Analizados</p>
          <p className="text-2xl font-bold text-white">{preciosProductos.length}</p>
        </Card>
        <Card className="p-4 bg-[#111827] border-[#1e293b]">
          <p className="text-[#64748b] text-sm mb-1">Precio Promedio</p>
          <p className="text-2xl font-bold text-[#10b981]">
            {formatearMoneda(preciosProductos.length > 0 ? preciosProductos.reduce((sum, p) => sum + p.precioPromedio, 0) / preciosProductos.length : 0)}
          </p>
        </Card>
        <Card className="p-4 bg-[#111827] border-[#1e293b]">
          <p className="text-[#64748b] text-sm mb-1">Total Compras</p>
          <p className="text-2xl font-bold text-[#f59e0b]">
            {compras.length}
          </p>
        </Card>
        <Card className="p-4 bg-[#111827] border-[#1e293b]">
          <p className="text-[#64748b] text-sm mb-1">Producto Más Comprado</p>
          <p className="text-lg font-bold text-[#3b82f6] truncate">
            {topProductos[0]?.producto || '-'}
          </p>
          <p className="text-xs text-[#64748b]">{topProductos[0]?.numCompras || 0} veces</p>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de precios - Top 5 */}
        <Card className="p-6 bg-[#111827] border-[#1e293b]">
          <h3 className="text-lg font-semibold text-white mb-4">Evolución de Precios (Top 5 productos con más variación)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosGraficoEvolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fecha" stroke="#64748b" tick={{ fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              {topProductos.slice(0, 5).map((p, i) => (
                <Line
                  key={p.producto}
                  type="monotone"
                  dataKey={p.producto}
                  stroke={['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'][i]}
                  strokeWidth={2}
                  dot={false}
                  name={p.producto.slice(0, 15) + (p.producto.length > 15 ? '...' : '')}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Distribución por rango de precios */}
        <Card className="p-6 bg-[#111827] border-[#1e293b]">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Rango de Precios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distribucionPrecios}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="rango" stroke="#64748b" tick={{ fill: '#64748b' }} />
              <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="cantidad" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tabla de variaciones de precios */}
      <Card className="overflow-hidden bg-[#111827] border-[#1e293b]">
        <div className="p-6 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#10b981]" />
            <h3 className="text-lg font-semibold text-white">Productos Más Comprados</h3>
          </div>
          <p className="text-sm text-[#64748b] mt-1">Ranking por frecuencia de compra</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0d1117]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#94a3b8]">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#94a3b8]">Producto</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#94a3b8]">Veces Comprado</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#94a3b8]">Gasto Total</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#94a3b8]">Precio Prom</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#94a3b8]">Última Compra</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.map((p) => {
                const esSubida = p.variacion > 0;
                const esSignificativa = Math.abs(p.variacion) > 5;
                return (
                  <tr key={p.producto} className="border-b border-[#1e293b] hover:bg-[#0d1117]/50">
                    <td className="px-4 py-3 text-sm text-white font-medium">{p.producto}</td>
                    <td className="px-4 py-3 text-sm text-right text-[#64748b]">{formatearMoneda(p.precioMin)}</td>
                    <td className="px-4 py-3 text-sm text-right text-[#94a3b8]">{formatearMoneda(p.precioPromedio)}</td>
                    <td className="px-4 py-3 text-sm text-right text-[#64748b]">{formatearMoneda(p.precioMax)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold ${
                        esSignificativa
                          ? esSubida
                            ? 'bg-[#ef4444]/10 text-[#ef4444]'
                            : 'bg-[#10b981]/10 text-[#10b981]'
                          : 'bg-[#64748b]/10 text-[#64748b]'
                      }`}>
                        {esSignificativa ? (
                          esSubida ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        <span>{p.variacion > 0 ? '+' : ''}{p.variacion.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
