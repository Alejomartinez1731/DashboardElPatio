'use client';

import { useEffect, useState } from 'react';
import { KPICardEnhanced } from '@/components/dashboard/kpi-card-enhanced';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Compra, KPIData, SheetName } from '@/types';
import { calcularKPIs } from '@/lib/data-utils';
import {
  LayoutDashboard,
  Table,
  TrendingUp,
  PieChart,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';

type TabId = 'historico' | 'historico_precios' | 'producto_costoso' | 'gasto_tienda' | 'precio_producto';

interface Tab {
  id: TabId;
  label: string;
  sheetName: SheetName;
  icon: typeof LayoutDashboard;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'historico',
    label: 'Histórico',
    sheetName: 'historico',
    icon: Table,
    description: 'Tabla completa de historial de compras'
  },
  {
    id: 'historico_precios',
    label: 'Histórico de Precios',
    sheetName: 'historico_precios',
    icon: TrendingUp,
    description: 'Evolución de precios por producto'
  },
  {
    id: 'producto_costoso',
    label: 'Producto más Costoso',
    sheetName: 'costosos',
    icon: ShoppingBag,
    description: 'Ranking de productos por precio'
  },
  {
    id: 'gasto_tienda',
    label: 'Gasto por Tienda',
    sheetName: 'gasto_tienda',
    icon: PieChart,
    description: 'Gastos acumulados por proveedor/tienda'
  },
  {
    id: 'precio_producto',
    label: 'Precio x Producto',
    sheetName: 'precio_producto',
    icon: AlertCircle,
    description: 'Comparativa de precios por producto'
  },
];

export default function DashboardPage() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('historico');
  const [sheetsData, setSheetsData] = useState<Record<SheetName, string[][]>>({} as any);
  const [loadingTabs, setLoadingTabs] = useState<Set<TabId>>(new Set());

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

        // Guardar datos crudos de todas las hojas
        const allData: Record<SheetName, string[][]> = {} as any;

        TABS.forEach(tab => {
          const sheetData = result.data[tab.sheetName];
          if (sheetData && sheetData.values) {
            allData[tab.sheetName] = sheetData.values;
          } else {
            allData[tab.sheetName] = [];
          }
        });

        setSheetsData(allData);

        // Procesar compras desde la hoja "historico"
        const hojaHistorico = result.data.historico;
        if (hojaHistorico && hojaHistorico.values) {
          const values = hojaHistorico.values as any[][];
          if (values.length > 1) {
            const cabeceras = values[0].map((h: string) => h.toLowerCase().trim());
            const comprasProcesadas: Compra[] = [];

            for (let i = 1; i < values.length; i++) {
              const fila = values[i];
              const obj: any = {};
              cabeceras.forEach((cab: string, idx: number) => { obj[cab] = fila[idx]; });

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

              if (compra.producto && !excluirFilaResumen(compra.producto)) {
                comprasProcesadas.push(compra);
              }
            }

            setCompras(comprasProcesadas);
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

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    console.log('Exportando a CSV...');
  };

  const handleFilter = () => {
    console.log('Abriendo filtros...');
  };

  // Estado de carga
  if (cargando) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
              Panel General
            </h1>
            <p className="text-[#94a3b8]">Tablas de Google Sheets</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
            <div className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#f59e0b]">Cargando...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#111827] border border-[#1e293b] rounded-lg animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f59e0b]/5 to-transparent animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-8 max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#ef4444]/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#ef4444] font-semibold mb-2">Error de Carga</p>
          <p className="text-[#94a3b8] text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#f59e0b] text-white rounded-lg">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-[#94a3b8] bg-clip-text text-transparent">
            Panel General
          </h1>
          <p className="text-[#94a3b8]">Tablas de Google Sheets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
            <div className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#10b981]">Conectado a n8n</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardEnhanced titulo="Gasto del Día" valor={kpiData?.gastoDelDia || 0} variacion={kpiData?.variacionDia} icono="euro" tipo="moneda" />
        <KPICardEnhanced titulo="Gasto del Mes" valor={kpiData?.gastoDelMes || 0} variacion={kpiData?.variacionMes} icono="activity" tipo="moneda" />
        <KPICardEnhanced titulo="Facturas Procesadas" valor={kpiData?.facturasProcesadas || 0} icono="shopping" tipo="numero" />
        <KPICardEnhanced titulo="Alertas de Precio" valor={kpiData?.alertasDePrecio || 0} icono="trending-up" tipo="numero" />
      </div>

      {/* Quick Actions */}
      <QuickActions onRefresh={handleRefresh} onExport={handleExport} onFilter={handleFilter} cargando={cargando} />

      {/* Tabs Navigation */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        {/* Tab Headers */}
        <div className="flex overflow-x-auto border-b border-[#1e293b] scrollbar-thin scrollbar-thumb-[#f59e0b]/20 scrollbar-track-transparent">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-all duration-200 relative ${
                  isActive
                    ? 'text-[#f59e0b] bg-[#f59e0b]/5'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#0d1117]/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content - TABLA CRUDA DE GOOGLE SHEETS */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-[#94a3b8] mb-4">
            {(() => {
              const Icon = TABS.find(t => t.id === activeTab)?.icon || Table;
              return <Icon className="w-5 h-5" />;
            })()}
            <p className="text-sm">{TABS.find(t => t.id === activeTab)?.description}</p>
            <span className="ml-auto text-xs bg-[#1e293b] px-2 py-1 rounded">
              {sheetsData[TABS.find(t => t.id === activeTab)?.sheetName || 'historico']?.length || 0} filas
            </span>
          </div>

          {/* TABLA DE DATOS CRUDOS */}
          <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117]">
                <tr>
                  {sheetsData[TABS.find(t => t.id === activeTab)?.sheetName || 'historico']?.[0]?.map((header: string, idx: number) => (
                    <th key={idx} className="px-4 py-3 text-left font-semibold text-[#94a3b8] whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {(sheetsData[TABS.find(t => t.id === activeTab)?.sheetName || 'historico']?.slice(1) || []).map((row: string[], rowIdx: number) => (
                  <tr key={rowIdx} className="hover:bg-[#0d1117]/50 transition-colors">
                    {row.map((cell: string, cellIdx: number) => (
                      <td key={cellIdx} className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mensaje si no hay datos */}
          {(!sheetsData[TABS.find(t => t.id === activeTab)?.sheetName || 'historico'] ||
            sheetsData[TABS.find(t => t.id === activeTab)?.sheetName || 'historico']?.length === 0) && (
            <div className="text-center py-12">
              <Table className="w-12 h-12 mx-auto mb-4 text-[#64748b]" />
              <p className="text-[#64748b]">No hay datos en esta tabla</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parsearFecha(fecha: string | Date): Date {
  if (fecha instanceof Date) {
    return isNaN(fecha.getTime()) ? new Date() : fecha;
  }
  if (!fecha || typeof fecha !== 'string') {
    return new Date();
  }
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

function excluirFilaResumen(descripcion: string): boolean {
  if (!descripcion) return true;
  const exclusiones = ['suma total', 'total general', 'total', 'subtotal', 'sub-total', 'iva', 'vat', 'tax', 'base imponible', 'base', 'recargo', 'equivalencia', 'devolución', 'devolucion', 'devoluc', '-', ''];
  return exclusiones.some(exclusion => descripcion.toLowerCase().trim().includes(exclusion));
}
