'use client';

import { useEffect, useState } from 'react';
import { KPICardEnhanced } from '@/components/dashboard/kpi-card-enhanced';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { Compra, KPIData, SheetName } from '@/types';
import { calcularKPIs } from '@/lib/data-utils';
import { Table, TrendingUp, PieChart, ShoppingBag, AlertCircle, Download } from 'lucide-react';
import { formatearMoneda } from '@/lib/formatters';

type TabId = 'historico' | 'historico_precios' | 'producto_costoso' | 'gasto_tienda' | 'precio_producto';

interface Tab {
  id: TabId;
  label: string;
  sheetName: SheetName;
  icon: any;
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
  const [sheetsData, setSheetsData] = useState<Record<string, string[][]>>({});

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
        const allData: Record<string, string[][]> = {};

        TABS.forEach(tab => {
          const sheetData = result.data[tab.sheetName];
          if (sheetData && sheetData.values && Array.isArray(sheetData.values)) {
            allData[tab.sheetName] = sheetData.values;
          } else {
            allData[tab.sheetName] = [];
          }
        });

        setSheetsData(allData);
        console.log('Datos cargados:', Object.keys(allData).map(k => `${k}: ${allData[k].length} filas`));

        // Procesar compras desde la hoja "historico" para KPIs
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
                fecha: parsearFecha(obj.fecha || ''),
                tienda: obj.tienda || '',
                producto: obj.descripcion || '',
                cantidad: parseFloat(obj.cantidad || '0') || 0,
                precioUnitario: parseFloat(obj['precio unitario'] || '0') || 0,
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
            setKpiData({ gastoDelDia: 0, gastoDelMes: 0, facturasProcesadas: 0, alertasDePrecio: 0 });
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
    const currentSheetName = TABS.find(t => t.id === activeTab)?.sheetName;
    const currentData = sheetsData[currentSheetName || ''];

    if (!currentData || currentData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Convertir a CSV
    const csv = currentData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSheetName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilter = () => {
    console.log('Abriendo filtros...');
  };

  if (cargando) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Panel General</h1>
            <p className="text-[#94a3b8]">Tablas de Google Sheets</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
            <div className="w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-[#f59e0b]">Cargando...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#111827] border border-[#1e293b] rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-8">
          <p className="text-[#ef4444] font-semibold mb-2">Error de Carga</p>
          <p className="text-[#94a3b8] text-sm mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#f59e0b] text-white rounded-lg">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const activeSheetName = TABS.find(t => t.id === activeTab)?.sheetName || 'historico';
  const activeData = sheetsData[activeSheetName] || [];
  const numRows = activeData.length;

  return (
    <div className="space-y-6 animate-fade-in">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardEnhanced titulo="Gasto del Día" valor={kpiData?.gastoDelDia || 0} variacion={kpiData?.variacionDia} icono="euro" tipo="moneda" />
        <KPICardEnhanced titulo="Gasto del Mes" valor={kpiData?.gastoDelMes || 0} variacion={kpiData?.variacionMes} icono="activity" tipo="moneda" />
        <KPICardEnhanced titulo="Facturas Procesadas" valor={kpiData?.facturasProcesadas || 0} icono="shopping" tipo="numero" />
        <KPICardEnhanced titulo="Alertas de Precio" valor={kpiData?.alertasDePrecio || 0} icono="trending-up" tipo="numero" />
      </div>

      <QuickActions onRefresh={handleRefresh} onExport={handleExport} onFilter={handleFilter} cargando={cargando} />

      <div className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[#1e293b] scrollbar-thin scrollbar-thumb-[#f59e0b]/20 scrollbar-track-transparent">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 whitespace-nowrap transition-all duration-200 relative ${
                  isActive ? 'text-[#f59e0b] bg-[#f59e0b]/5' : 'text-[#94a3b8] hover:text-white hover:bg-[#0d1117]/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#94a3b8]">
              {(() => {
                const Icon = TABS.find(t => t.id === activeTab)?.icon || Table;
                return <Icon className="w-5 h-5" />;
              })()}
              <p className="text-sm">{TABS.find(t => t.id === activeTab)?.description}</p>
              <span className="ml-2 text-xs bg-[#1e293b] px-2 py-1 rounded-full">
                {numRows} filas
              </span>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 rounded-lg transition-all"
            >
              <Download className="w-3 h-3" />
              Exportar CSV
            </button>
          </div>

          {numRows === 0 ? (
            <div className="text-center py-16">
              <Table className="w-16 h-16 mx-auto mb-4 text-[#64748b]" />
              <p className="text-[#64748b]">No hay datos en esta tabla</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1e293b]">
              <table className="w-full text-sm">
                <thead className="bg-[#0d1117] sticky top-0">
                  <tr>
                    {activeData[0]?.map((header: string, idx: number) => (
                      <th key={idx} className="px-4 py-3 text-left font-semibold text-white whitespace-nowrap border-b-2 border-[#f59e0b]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {activeData.slice(1).map((row: string[], rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-[#0d1117]/50 transition-colors">
                      {row.map((cell: string, cellIdx: number) => {
                        const isNumber = !isNaN(parseFloat(cell)) && cell !== '';
                        const isPrice = cellIdx >= 4 && cellIdx <= 6;
                        return (
                          <td key={cellIdx} className={`px-4 py-3 whitespace-nowrap ${
                            isPrice ? 'text-right' : 'text-left'
                          }`}>
                            <span className={isNumber && isPrice ? 'text-white font-mono' : 'text-[#94a3b8]'}>
                              {cell || '-'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

function excluirFilaResumen(descripcion: string): boolean {
  if (!descripcion) return true;
  const exclusiones = ['suma total', 'total general', 'total', 'subtotal', 'sub-total', 'iva', 'vat', 'tax', 'base imponible', 'base', 'recargo', 'equivalencia', 'devolución', 'devolucion', 'devoluc', '-', ''];
  return exclusiones.some(exclusion => descripcion.toLowerCase().trim().includes(exclusion));
}
