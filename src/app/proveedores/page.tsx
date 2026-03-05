'use client';

import { useEffect, useState } from 'react';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { COLORES_TIENDA } from '@/lib/data-utils';
import { Store, TrendingUp, Calendar, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/lib/supabase';

interface InfoTienda {
  tienda: string;
  restaurante_id: string | null;
  total_compras: number;
  productos_unicos: number;
  gasto_total: number;
  precio_promedio: number;
  primera_compra: string;
  ultima_compra: string;
  color: string; // Agregado para el color del gráfico
}

export default function ProveedoresPage() {
  const [infoTiendas, setInfoTiendas] = useState<InfoTienda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDatos() {
      try {
        // Llamada directa a Supabase - sin API route intermedia
        const { data, error } = await supabase
          .from('vista_gasto_por_tienda')
          .select('*')
          .order('gasto_total', { ascending: false });

        if (error) throw new Error(error.message);

        // Transformar datos para incluir colores
        const tiendasConColor = (data || []).map((t: InfoTienda) => ({
          ...t,
          color: COLORES_TIENDA[t.tienda] || COLORES_TIENDA['Otros']
        }));

        setInfoTiendas(tiendasConColor);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setCargando(false);
      }
    }
    fetchDatos();
  }, []);

  // Datos para gráficos
  const datosGraficoDistribucion = infoTiendas.map(t => ({
    name: t.tienda,
    value: t.gasto_total,
    color: t.color,
  }));

  const datosGraficoBarras = infoTiendas.map(t => ({
    name: t.tienda,
    gasto: t.gasto_total,
    compras: t.total_compras,
  }));

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Cargando proveedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-6 text-center">
        <p className="text-[#ef4444] mb-2">Error al cargar datos</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Proveedores</h1>
        <p className="text-muted-foreground">Análisis detallado por tienda/proveedor</p>
      </div>

      {/* KPIs generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Total Tiendas</p>
          <p className="text-2xl font-bold text-white">{infoTiendas.length}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Gasto Total</p>
          <p className="text-2xl font-bold text-chart-1">{formatearMoneda(infoTiendas.reduce((sum, t) => sum + t.gasto_total, 0))}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Tienda Principal</p>
          <p className="text-2xl font-bold text-primary">{infoTiendas[0]?.tienda || '-'}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Gasto en Principal</p>
          <p className="text-2xl font-bold text-chart-2">{formatearMoneda(infoTiendas[0]?.gasto_total || 0)}</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por tienda - Pie */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución de Gastos por Tienda</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosGraficoDistribucion}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name}: ${((entry.value / datosGraficoDistribucion.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%`}
              >
                {datosGraficoDistribucion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                formatter={(valor: number | undefined) => [formatearMoneda(valor || 0), 'Gasto']}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gastos y compras - Bar */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Gastos y Número de Compras</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGraficoBarras}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <YAxis yAxisId="left" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                formatter={(valor: number | undefined, nombre: string | undefined) => {
                  if (nombre === 'Gasto Total (€)') {
                    return [formatearMoneda(valor || 0), nombre];
                  }
                  if (nombre === 'Número de Compras') {
                    return [Math.round(valor || 0).toLocaleString('es-ES'), nombre];
                  }
                  return [valor, nombre];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="gasto" fill="hsl(var(--primary))" name="Gasto Total (€)" />
              <Bar yAxisId="right" dataKey="compras" fill="hsl(var(--chart-1))" name="Número de Compras" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tarjetas de tiendas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {infoTiendas.map((tienda) => (
          <Card key={tienda.tienda} className="p-6 bg-card border-border hover:border-primary/30 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: tienda.color + '20' }}>
                  <Store className="w-6 h-6" style={{ color: tienda.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{tienda.tienda}</h3>
                  <p className="text-sm text-muted-foreground">{tienda.total_compras} compras realizadas</p>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: tienda.color + '20' }}>
                <Award className="w-5 h-5" style={{ color: tienda.color }} />
              </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Total Gastado</p>
                <p className="text-lg font-bold text-chart-1">{formatearMoneda(tienda.gasto_total)}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Gasto Promedio</p>
                <p className="text-lg font-bold text-primary">{formatearMoneda(tienda.gasto_total / tienda.total_compras)}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Productos Únicos</p>
                <p className="text-lg font-bold text-chart-2">{tienda.productos_unicos}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Precio Promedio</p>
                <p className="text-lg font-bold text-muted-foreground">{formatearMoneda(tienda.precio_promedio)}</p>
              </div>
            </div>

            {/* Información de contacto - TEMPORALMENTE OCULTO */}
            {/* La vista de Supabase no incluye teléfono/dirección por ahora
            {(tienda.telefonos.size > 0 || tienda.direcciones.size > 0) && (
              <div className="space-y-2 mb-4 pb-4 border-b border-border">
                {tienda.telefonos.size > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{Array.from(tienda.telefonos)[0]}</span>
                  </div>
                )}
                {tienda.direcciones.size > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground line-clamp-2">{Array.from(tienda.direcciones)[0]}</span>
                  </div>
                )}
              </div>
            )}
            */}

            {/* Fechas */}
            <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Primera compra:</span>
                <span className="text-muted-foreground">{formatearFecha(new Date(tienda.primera_compra))}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Última compra:</span>
                <span className="text-muted-foreground">{formatearFecha(new Date(tienda.ultima_compra))}</span>
              </div>
            </div>

            {/* Productos top - TEMPORALMENTE OCULTO */}
            {/* La vista de Supabase no incluye productos top por ahora
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Productos Más Comprados</p>
              <div className="space-y-2">
                {tienda.productosTop.slice(0, 3).map((p, i) => (
                  <div key={p.producto} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-primary text-white' : i === 1 ? 'bg-muted-foreground text-white' : 'bg-card text-muted-foreground'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-white truncate">{p.producto}</span>
                    </div>
                    <span className="text-chart-1 font-semibold">{formatearMoneda(p.total)}</span>
                  </div>
                ))}
              </div>
            </div>
            */}
          </Card>
        ))}
      </div>
    </div>
  );
}
