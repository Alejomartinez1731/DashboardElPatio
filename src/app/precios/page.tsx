'use client';

import { useEffect, useState } from 'react';
import { Compra } from '@/types';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { normalizarTienda, COLORES_TIENDA, normalizarFecha } from '@/lib/data-utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MonthlyComparison } from '@/components/dashboard/monthly-comparison';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';

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
                fecha: normalizarFecha(obj.fecha || ''),
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

  // Datos para gráfico de evolución del gasto quincenal
  const datosGraficoEvolucion = useMemo(() => {
    if (compras.length === 0) return [];

    // Agrupar compras por periodos quincenales (cada 15 días)
    const gastoPorPeriodo: Record<string, number> = {};

    // Encontrar la fecha más antigua y más reciente
    const fechas = compras.map(c => c.fecha.getTime());
    const fechaMin = new Date(Math.min(...fechas));
    const fechaMax = new Date(Math.max(...fechas));

    // Crear periodos quincenales desde la fecha más antigua hasta hoy
    let fechaActual = new Date(fechaMin);
    fechaActual.setDate(1); // Empezar el primer día del mes
    fechaActual.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    while (fechaActual <= hoy) {
      const año = fechaActual.getFullYear();
      const mes = fechaActual.getMonth();
      const dia = fechaActual.getDate();

      // Determinar si es primera o segunda quincena (Q1 o Q2)
      const esPrimeraQuincena = dia <= 15;
      const quincena = esPrimeraQuincena ? 'Q1' : 'Q2';
      const clave = `${año}-${mes + 1}-${quincena}`;

      // Calcular rango de fechas para este periodo
      const inicioPeriodo = new Date(año, mes, esPrimeraQuincena ? 1 : 16);
      const finPeriodo = new Date(año, mes, esPrimeraQuincena ? 15 : (new Date(año, mes + 1, 0).getDate()));

      // Sumar gastos de este periodo
      let gastoPeriodo = 0;
      compras.forEach(c => {
        if (c.fecha >= inicioPeriodo && c.fecha <= finPeriodo) {
          gastoPeriodo += c.total;
        }
      });

      gastoPorPeriodo[clave] = gastoPeriodo;

      // Avanzar al siguiente periodo quincenal
      if (dia <= 15) {
        fechaActual.setDate(16);
      } else {
        fechaActual.setMonth(mes + 1);
        fechaActual.setDate(1);
      }
    }

    // Convertir a array para el gráfico
    return Object.entries(gastoPorPeriodo)
      .map(([clave, gasto]) => {
        const [año, mes, quincena] = clave.split('-');
        const nombreMes = new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'short' });
        const esPrimeraQuincena = quincena === 'Q1';

        // Formato: "Ene 1-15" o "Ene 16-31"
        const diaInicio = esPrimeraQuincena ? '1' : '16';
        const diaFin = esPrimeraQuincena ? '15' : new Date(parseInt(año), parseInt(mes), 0).getDate().toString();
        const rangoDias = `${diaInicio}-${diaFin}`;

        // Capitalizar primera letra del mes
        const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

        return {
          periodo: `${mesCapitalizado} ${rangoDias}`,
          gasto: gasto,
        };
      })
      .filter(d => d.gasto > 0); // Solo mostrar periodos con gastos
  }, [compras]);

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
        <p className="text-muted-foreground">Evolución y variaciones de precios por producto</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Productos Analizados</p>
          <p className="text-2xl font-bold text-white">{preciosProductos.length}</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Precio Promedio</p>
          <p className="text-2xl font-bold text-[#10b981]">
            {formatearMoneda(preciosProductos.length > 0 ? preciosProductos.reduce((sum, p) => sum + p.precioPromedio, 0) / preciosProductos.length : 0)}
          </p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Total Compras</p>
          <p className="text-2xl font-bold text-[#f59e0b]">
            {compras.length}
          </p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-muted-foreground text-sm mb-1">Producto Más Comprado</p>
          <p className="text-lg font-bold text-[#3b82f6] truncate">
            {topProductos[0]?.producto || '-'}
          </p>
          <p className="text-xs text-muted-foreground">{topProductos[0]?.numCompras || 0} veces</p>
        </Card>
      </div>

      {/* Comparativa Mensual */}
      <MonthlyComparison compras={compras} />

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución del gasto quincenal */}
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-white mb-4">Evolución del Gasto Quincenal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={datosGraficoEvolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="periodo" stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(valor: any) => [formatearMoneda(valor), 'Gasto']}
              />
              <Area
                type="monotone"
                dataKey="gasto"
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
            <BarChart data={distribucionPrecios}>
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
          <p className="text-sm text-muted-foreground mt-1">Ranking por frecuencia de compra</p>
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
              {topProductos.map((p, index) => {
                const ultimaCompra = p.historial[p.historial.length - 1];
                return (
                  <tr key={p.producto} className="border-b border-border hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm text-white font-bold">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{p.producto}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-semibold">
                        {p.numCompras}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[#10b981] font-semibold">{formatearMoneda(p.gastoTotal)}</td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatearMoneda(p.precioPromedio)}</td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">{formatearFecha(ultimaCompra?.fecha || new Date())}</td>
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
