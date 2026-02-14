'use client';

import { useEffect, useState } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { WeeklyChart } from '@/components/dashboard/weekly-chart';
import { DistributionChart } from '@/components/dashboard/distribution-chart';
import { PriceAlerts } from '@/components/dashboard/price-alerts';
import { TopProducts } from '@/components/dashboard/top-products';
import { Compra, KPIData, SheetName } from '@/types';
import { calcularKPIs } from '@/lib/data-utils';
import { formatearFecha } from '@/lib/formatters';

export default function DashboardPage() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);

  useEffect(() => {
    async function fetchDatos() {
      try {
        setCargando(true);
        setError(null);

        const response = await fetch('/api/sheets');

        if (!response.ok) {
          throw new Error('Error al obtener datos de Google Sheets');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Error desconocido');
        }

        // Procesar datos de "Histórico de Precios"
        const hojaPrecios = result.data.historico_precios;

        if (hojaPrecios && hojaPrecios.values) {
          // Convertir filas crudas a compras
          const values = hojaPrecios.values as any[][];

          if (values.length > 1) {
            const cabeceras = values[0].map((h: string) => h.toLowerCase().trim());
            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};

              cabeceras.forEach((cab: string, idx: number) => {
                obj[cab] = fila[idx];
              });

              // Mapear campos según estructura de Google Sheets
              const compra: Compra = {
                id: `compra-${i}-${Date.now()}`,
                fecha: parsearFecha(obj.fecha || obj.fechado || ''),
                tienda: obj.tienda || '',
                producto: obj.descripcion || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(obj['precio unitario'] || obj.preciounitario || '0') || 0,
                total: parseFloat(obj.total || '0') || 0,
                telefono: obj.telefono,
                direccion: obj.direccion,
              };

              // Filtrar filas de resumen
              if (compra.producto && !excluirFilaResumen(compra.producto)) {
                comprasProcesadas.push(compra);
              }
            }

            setCompras(comprasProcesadas);

            // Calcular KPIs
            const kpis = calcularKPIs(comprasProcesadas);
            setKpiData(kpis);
          } else {
            setCompras([]);
            setKpiData({
              gastoDelDia: 0,
              gastoDelMes: 0,
              facturasProcesadas: 0,
              alertasDePrecio: 0,
            });
          }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setCargando(false);
      }
    }

    fetchDatos();
  }, []);

  // Estado de carga
  if (cargando) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Panel General</h1>
          <p className="text-[#94a3b8]">Visión general de compras y gastos</p>
        </div>

        {/* Skeleton de KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-[#111827] border border-[#1e293b] rounded-lg animate-pulse"></div>
          ))}
        </div>

        {/* Skeleton de gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[#111827] border border-[#1e293b] rounded-lg animate-pulse"></div>
          <div className="h-80 bg-[#111827] border border-[#1e293b] rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-8 max-w-md">
          <p className="text-[#ef4444] font-semibold mb-2">⚠️ Error de Carga</p>
          <p className="text-[#94a3b8] text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#f59e0b]/80 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Panel General</h1>
        <p className="text-[#94a3b8]">Visión general de compras y gastos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Gasto del Día"
          valor={kpiData?.gastoDelDia || 0}
          variacion={kpiData?.variacionDia}
        />
        <KPICard
          titulo="Gasto del Mes"
          valor={kpiData?.gastoDelMes || 0}
          variacion={kpiData?.variacionMes}
        />
        <KPICard
          titulo="Facturas Procesadas"
          valor={kpiData?.facturasProcesadas || 0}
          tipo="numero"
        />
        <KPICard
          titulo="Alertas de Precio"
          valor={kpiData?.alertasDePrecio || 0}
          tipo="numero"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyChart datos={compras} />
        <DistributionChart datos={compras} />
      </div>

      {/* Alertas y Top Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriceAlerts compras={compras} />
        <TopProducts compras={compras} />
      </div>
    </div>
  );
}

// Función auxiliar para parsear fechas
function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) {
    return isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  if (!fecha || typeof fecha !== 'string') {
    return new Date();
  }

  // Formato DD/MM/YYYY
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
  if (isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

// Función auxiliar para excluir filas de resumen
function excluirFilaResumen(descripcion: string): boolean {
  if (!descripcion) return true;

  const exclusiones = [
    'suma total', 'total general',
    'total', 'subtotal', 'sub-total',
    'iva', 'vat', 'tax',
    'base imponible', 'base',
    'recargo', 'equivalencia',
    'devolución', 'devolucion', 'devoluc',
    '-', '',
  ];

  const descLower = descripcion.toLowerCase().trim();

  return exclusiones.some(exclusion => descLower.includes(exclusion));
}
