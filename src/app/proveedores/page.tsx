'use client';

import { useEffect, useState } from 'react';
import { Compra } from '@/types';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { normalizarTienda, COLORES_TIENDA } from '@/lib/data-utils';
import { Store, MapPin, Phone, ShoppingCart, TrendingUp, Calendar, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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

interface InfoTienda {
  nombre: string;
  color: string;
  totalGastado: number;
  numCompras: number;
  productosUnicos: number;
  gastoPromedio: number;
  precioPromedio: number;
  primeraCompra: Date;
  ultimaCompra: Date;
  telefonos: Set<string>;
  direcciones: Set<string>;
  productosTop: { producto: string; total: number }[];
}

export default function ProveedoresPage() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function fetchDatos() {
      try {
        const response = await fetch('/api/sheets');
        const result = await response.json();
        if (result.success && result.data.base_de_datos?.values) {
          const values = result.data.base_de_datos.values as any[][];
          if (values.length > 1) {
            const cabeceras = values[0].map((h: string) => h.toLowerCase().trim());
            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};
              cabeceras.forEach((cab: string, idx: number) => { obj[cab] = fila[idx]; });

              const tiendaNormalizada = normalizarTienda(obj.tienda || '');

              const compra: Compra = {
                id: `compra-${i}`,
                fecha: parsearFecha(obj.fecha || ''),
                tienda: tiendaNormalizada,
                producto: obj.descripcion || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(obj['precio_unitario'] || obj['precio unitario'] || '0') || 0,
                total: parseFloat(obj.total || '0') || 0,
                telefono: obj.telefono,
                direccion: obj.direccion,
              };

              if (compra.producto && !compra.producto.toLowerCase().includes('total')) {
                comprasProcesadas.push(compra);
              }
            }
            setCompras(comprasProcesadas);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setCargando(false);
      }
    }
    fetchDatos();
  }, []);

  // Analizar información por tienda
  const infoTiendas = useMemo(() => {
    const tiendas: Record<string, Compra[]> = {};

    compras.forEach(compra => {
      const tiendaNormalizada = normalizarTienda(compra.tienda);
      if (!tiendas[tiendaNormalizada]) {
        tiendas[tiendaNormalizada] = [];
      }
      tiendas[tiendaNormalizada].push(compra);
    });

    return Object.entries(tiendas).map(([nombre, comprasTienda]) => {
      const productos: Record<string, number> = {};
      let totalGastado = 0;
      let precioTotal = 0;
      const telefonos = new Set<string>();
      const direcciones = new Set<string>();
      let primeraCompra = comprasTienda[0].fecha;
      let ultimaCompra = comprasTienda[0].fecha;

      comprasTienda.forEach(c => {
        totalGastado += c.total;
        precioTotal += c.precioUnitario;
        productos[c.producto] = (productos[c.producto] || 0) + c.total;
        if (c.telefono) telefonos.add(c.telefono);
        if (c.direccion) direcciones.add(c.direccion);
        if (c.fecha < primeraCompra) primeraCompra = c.fecha;
        if (c.fecha > ultimaCompra) ultimaCompra = c.fecha;
      });

      const productosTop = Object.entries(productos)
        .map(([producto, total]) => ({ producto, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return {
        nombre,
        color: COLORES_TIENDA[nombre] || COLORES_TIENDA['Otros'],
        totalGastado,
        numCompras: comprasTienda.length,
        productosUnicos: Object.keys(productos).length,
        gastoPromedio: totalGastado / comprasTienda.length,
        precioPromedio: precioTotal / comprasTienda.length,
        primeraCompra,
        ultimaCompra,
        telefonos,
        direcciones,
        productosTop,
      } as InfoTienda;
    }).sort((a, b) => b.totalGastado - a.totalGastado);
  }, [compras]);

  // Datos para gráficos
  const datosGraficoDistribucion = infoTiendas.map(t => ({
    name: t.nombre,
    value: t.totalGastado,
    color: t.color,
  }));

  const datosGraficoBarras = infoTiendas.map(t => ({
    name: t.nombre,
    gasto: t.totalGastado,
    compras: t.numCompras,
  }));

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
          <p className="text-2xl font-bold text-chart-1">{formatearMoneda(compras.reduce((sum, c) => sum + c.total, 0))}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Tienda Principal</p>
          <p className="text-2xl font-bold text-primary">{infoTiendas[0]?.nombre || '-'}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Gasto en Principal</p>
          <p className="text-2xl font-bold text-chart-2">{formatearMoneda(infoTiendas[0]?.totalGastado || 0)}</p>
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
                formatter={(valor: any) => [formatearMoneda(valor), 'Gasto']}
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
          <Card key={tienda.nombre} className="p-6 bg-card border-border hover:border-primary/30 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: tienda.color + '20' }}>
                  <Store className="w-6 h-6" style={{ color: tienda.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{tienda.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{tienda.numCompras} compras realizadas</p>
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
                <p className="text-lg font-bold text-chart-1">{formatearMoneda(tienda.totalGastado)}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Gasto Promedio</p>
                <p className="text-lg font-bold text-primary">{formatearMoneda(tienda.gastoPromedio)}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Productos Únicos</p>
                <p className="text-lg font-bold text-chart-2">{tienda.productosUnicos}</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Precio Promedio</p>
                <p className="text-lg font-bold text-muted-foreground">{formatearMoneda(tienda.precioPromedio)}</p>
              </div>
            </div>

            {/* Información de contacto */}
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

            {/* Fechas */}
            <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Primera compra:</span>
                <span className="text-muted-foreground">{formatearFecha(tienda.primeraCompra)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Última compra:</span>
                <span className="text-muted-foreground">{formatearFecha(tienda.ultimaCompra)}</span>
              </div>
            </div>

            {/* Productos top */}
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
          </Card>
        ))}
      </div>
    </div>
  );
}
