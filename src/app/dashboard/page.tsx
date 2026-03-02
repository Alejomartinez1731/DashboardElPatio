'use client';

import { useEffect, useState } from 'react';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { FilterPanel } from '@/components/dashboard/filter-panel';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { RecordatoriosReposicion } from '@/components/dashboard/recordatorios-reposicion';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { DashboardTabs, TABS } from '@/components/dashboard/dashboard-tabs';
import { DataTable, DataTableWrapper } from '@/components/dashboard/data-table';
import { KPIsSkeleton, BudgetSkeleton, TableSkeleton, QuickActionsSkeleton } from '@/components/dashboard/dashboard-skeletons';
import { exportToExcel, crearHojaExcel } from '@/lib/export-excel';
import { categorizarProducto } from '@/lib/categorias';
import { Compra, KPIData, SheetName, CATEGORIAS_INFO } from '@/types';
import { normalizarTienda } from '@/lib/data-utils';
import { Table } from 'lucide-react';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { useSheetData } from '@/hooks/useSheetData';
import { useDashboardStore } from '@/store/useDashboardStore';
import { parsearFecha } from '@/lib/parsers';

interface Filtros {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  rangoFecha: 'todo' | 'hoy' | 'semana' | 'mes' | 'mesPasado' | 'anio';
  tiendas: string[];
  busqueda: string;
  precioMin: number | null;
  precioMax: number | null;
}

type SortField = 'fecha' | 'tienda' | 'producto' | 'cantidad' | 'precio' | 'total';

export default function DashboardPage() {
  // Hook personalizado para obtener datos de Sheets
  const tabsConfig = TABS.map(tab => ({
    id: tab.id,
    sheetName: tab.sheetName,
    dataKey: tab.sheetName === 'base_datos' ? 'base_de_datos' : tab.sheetName,
  }));

  const {
    compras,
    comprasFiltradas,
    sheetsData,
    kpiData,
    loading: cargando,
    error,
    refetch,
  } = useSheetData(tabsConfig);

  // Zustand store
  const {
    activeTab,
    setActiveTab,
    filtros,
    setFiltros,
    showFilters,
    setShowFilters,
  } = useDashboardStore();

  // Ordenamiento local (no en el store por ahora)
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = más reciente primero

  // Local state para filtered data (will override the one from hook when filters are applied)
  const [localComprasFiltradas, setLocalComprasFiltradas] = useState<Compra[]>([]);

  // Estado de refresco
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    console.log('Aplicando filtros:', filtros);
    let filtradas = [...compras];

    // Filtro por rango de fechas
    if (filtros.fechaInicio) {
      const inicio = new Date(filtros.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      filtradas = filtradas.filter(c => c.fecha >= inicio);
      console.log('Filtro fecha inicio:', inicio, '->', filtradas.length, 'filas');
    }
    if (filtros.fechaFin) {
      const fin = new Date(filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);
      filtradas = filtradas.filter(c => c.fecha <= fin);
      console.log('📅 Filtro fecha fin:', fin, '->', filtradas.length, 'filas');
    }

    // Filtro por tiendas
    if (filtros.tiendas.length > 0) {
      filtradas = filtradas.filter(c => filtros.tiendas.includes(normalizarTienda(c.tienda)));
      console.log('🏪 Filtro tiendas:', filtros.tiendas, '->', filtradas.length, 'filas');
    }

    // Filtro por búsqueda de producto
    if (filtros.busqueda) {
      const busquedaLower = filtros.busqueda.toLowerCase().trim();
      filtradas = filtradas.filter(c =>
        c.producto.toLowerCase().includes(busquedaLower)
      );
      console.log('🔎 Filtro búsqueda:', filtros.busqueda, '->', filtradas.length, 'filas');
    }

    // Filtro por rango de precios
    if (filtros.precioMin !== null) {
      filtradas = filtradas.filter(c => c.precioUnitario >= filtros.precioMin!);
      console.log('💰 Filtro precio min:', filtros.precioMin, '->', filtradas.length, 'filas');
    }
    if (filtros.precioMax !== null) {
      filtradas = filtradas.filter(c => c.precioUnitario <= filtros.precioMax!);
      console.log('💰 Filtro precio max:', filtros.precioMax, '->', filtradas.length, 'filas');
    }

    // Aplicar ordenamiento
    filtradas.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'fecha':
          aVal = a.fecha.getTime();
          bVal = b.fecha.getTime();
          break;
        case 'tienda':
          aVal = normalizarTienda(a.tienda);
          bVal = normalizarTienda(b.tienda);
          break;
        case 'producto':
          aVal = a.producto.toLowerCase();
          bVal = b.producto.toLowerCase();
          break;
        case 'cantidad':
          aVal = a.cantidad;
          bVal = b.cantidad;
          break;
        case 'precio':
          aVal = a.precioUnitario;
          bVal = b.precioUnitario;
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
          break;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : (aVal < bVal ? -1 : 0);
      return aVal < bVal ? 1 : (aVal > bVal ? -1 : 0);
    });

    console.log('Filtrado final:', filtradas.length, 'de', compras.length, 'filas');
    setLocalComprasFiltradas(filtradas);
  }, [compras, filtros, sortField, sortOrder]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    // Crear hojas para exportar: todas las pestañas disponibles
    const hojasParaExportar: { nombre: string; datos: string[][] }[] = [];

    TABS.forEach(tab => {
      const sheetName = tab.sheetName;
      const data = sheetsData[sheetName];

      if (data && data.length > 0) {
        // Identificar columnas de moneda (PRECIO, TOTAL, SUMA, etc.)
        const cabeceras = data[0] || [];
        const columnasMoneda = cabeceras
          .map((cab, idx) => {
            const cabLower = String(cab).toLowerCase();
            if (cabLower.includes('precio') || cabLower.includes('total') || cabLower.includes('suma') || cabLower.includes('monto')) {
              return idx;
            }
            return -1;
          })
          .filter(idx => idx >= 0);

        hojasParaExportar.push({
          nombre: tab.label,
          datos: data,
        });
      }
    });

    if (hojasParaExportar.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Exportar a Excel
    exportToExcel(hojasParaExportar, `dashboard_el_patio_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  // Actualizar el store cuando cambian las compras
  useEffect(() => {
    useDashboardStore.getState().setCompras(compras);
    useDashboardStore.getState().setComprasFiltradas(comprasFiltradas);
  }, [compras, comprasFiltradas]);

  // Obtener tiendas únicas
  const tiendasUnicas = Array.from(new Set(compras.map(c => normalizarTienda(c.tienda)))).sort();

  // Función para ordenar
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Estado de carga para skeletons - mostrar solo en carga inicial
  const showSkeletons = cargando && compras.length === 0;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-[#1a2234] border border-[#ef4444]/30 rounded-lg p-8">
          <p className="text-[#ef4444] font-semibold mb-2">Error de Carga</p>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
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

  // Determinar qué compras filtradas usar (si hay filtros activos, usar local)
  const hayFiltrosActivos = filtros.busqueda !== '' || filtros.tiendas.length > 0 || filtros.rangoFecha !== 'todo' || filtros.precioMin !== null || filtros.precioMax !== null || filtros.fechaInicio !== null || filtros.fechaFin !== null;
  const comprasFiltradasFinal = hayFiltrosActivos ? localComprasFiltradas : compras;
  const numFilasFiltradas = comprasFiltradasFinal.length;

  console.log('Estado del dashboard:', {
    activeTab,
    activeSheetName,
    numRows,
    numFilasFiltradas,
    totalCompras: compras.length,
    hayFiltrosActivos,
    filtros,
    sheetsDataKeys: Object.keys(sheetsData)
  });

  // Usar comprasFiltradas para base_datos cuando hay filtros activos
  const comprasParaTabla = activeTab === 'base_datos' ? comprasFiltradasFinal : compras;

  const comprasComoTabla = activeTab === 'base_datos'
    ? [...comprasParaTabla].sort((a, b) => b.fecha.getTime() - a.fecha.getTime()).map(c => {
        const categoria = categorizarProducto(c.producto);
        const categoriaInfo = CATEGORIAS_INFO[categoria];
        const row = [
          formatearFecha(c.fecha),
          c.tienda,
          c.producto,
          `${categoriaInfo.icono} ${categoriaInfo.nombre}`,
          c.precioUnitario.toFixed(2).replace('.00', ''),
          c.cantidad.toString(),
          c.total.toFixed(2).replace('.00', ''),
          c.telefono || '',
          c.direccion || ''
        ];
        console.log('Row de compra:', row, 'Tipos:', row.map(r => typeof r));
        return row;
      })
    : [];

  // Para base_datos, calcular el número real de filas desde compras
  const numFilasBaseDatos = activeTab === 'base_datos' ? comprasComoTabla.length : numRows;

  console.log('Renderizando tabla:', { activeTab, activeSheetName, numRows, activeDataLength: activeData.length, numFilasBaseDatos });

  // Cabeceras personalizadas para Histórico
  const cabecerasHistorico = ['FECHA', 'TIENDA', 'PRODUCTO', 'CATEGORÍA', 'PRECIO', 'CANTIDAD', 'TOTAL', 'TELÉFONO', 'DIRECCIÓN'];

  // Para pestañas que no son histórico, arreglar cabeceras si es necesario
  let datosTabla = activeTab === 'base_datos'
    ? [cabecerasHistorico, ...comprasComoTabla]
    : activeData;

  // Normalizar cabeceras en todas las pestañas
  if (datosTabla.length > 0) {
      // Para otras pestañas, normalizar normalmente
      datosTabla = datosTabla.map((row, idx) => {
        if (idx === 0) {
          // Es la cabecera - normalizarla
          return row.map((cell: string | number) => {
            const cellStr = String(cell).toLowerCase().trim();

            // Reemplazos específicos
            // Ocultar columnas de row_number/ID retornando string vacío
            if (cellStr === 'row_number' || cellStr === 'row number' || cellStr === 'id' || (cellStr.startsWith('col') && cellStr.match(/^col-?\d*$/))) {
              return ''; // Columna oculta
            }
            if (cellStr === 'fecha' || cellStr === 'date') {
              return 'FECHA';
            }
            if (cellStr === 'tienda' || cellStr === 'store') {
              return 'TIENDA';
            }
            if (cellStr === 'descripcion' || cellStr === 'descripción' || cellStr === 'producto' || cellStr === 'product') {
              return 'PRODUCTO';
            }
            if (cellStr === 'precio_unitario' || cellStr === 'precio unitario' || cellStr === 'precio' || cellStr === 'precio_promedio' || cellStr === 'precio promedio' || cellStr === 'sum de precio unitario') {
              return 'PRECIO';
            }
            if (cellStr === 'cantidad' || cellStr === 'quantity') {
              return 'CANTIDAD';
            }
            if (cellStr === 'total') {
              return 'TOTAL';
            }
            if (cellStr === 'telefono' || cellStr === 'teléfono') {
              return 'TELÉFONO';
            }
            if (cellStr === 'direccion' || cellStr === 'dirección') {
              return 'DIRECCIÓN';
            }

            // Para cabeceras tipo "COL-X", mejorarlas
            if (cellStr.match(/^col-\d+$/)) {
              return `DATOS ${cellStr.replace('col-', '')}`;
            }

            // Para otras cabeceras, limpiar y poner en mayúsculas
            return cellStr
              .replace(/_/g, ' ')        // Guiones bajos a espacios
              .replace(/-/g, ' ')        // Guiones a espacios
              .replace(/\s+/g, ' ')      // Múltiples espacios a uno solo
              .trim()
              .toUpperCase();
          });
        }
        return row;
      });

    console.log('📊 Cabeceras finales para', activeTab, ':', datosTabla[0]);
  }

  if (activeTab === 'base_datos') {
    console.log('📊 Estado de Histórico:');
    console.log('  - comprasFiltradasFinal.length:', comprasFiltradasFinal.length);
    console.log('  - compras.length:', compras.length);
    console.log('  - comprasComoTabla.length:', comprasComoTabla.length);
    console.log('  - datosTabla.length:', datosTabla.length);
    console.log('  - datosTabla[0]:', datosTabla[0]);
    console.log('  - datosTabla[1]:', datosTabla[1]);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <DashboardHeader
        title="Panel General"
        description="Tablas de Google Sheets"
        statusBadge={{
          text: showSkeletons ? 'Cargando...' : 'Conectado a n8n',
          color: showSkeletons ? 'bg-[#f59e0b]/10 border border-primary/30' : 'bg-[#10b981]/10 border border-[#10b981]/30'
        }}
      />

      {/* KPIs */}
      {showSkeletons ? <KPIsSkeleton /> : <DashboardKPIs kpiData={kpiData} />}

      {/* Presupuesto Mensual */}
      {showSkeletons ? <BudgetSkeleton /> : <BudgetProgress compras={compras} presupuestoInicial={3000} />}

      {/* Recordatorios de Reposición */}
      <RecordatoriosReposicion />

      {/* Quick Actions */}
      {showSkeletons ? (
        <QuickActionsSkeleton />
      ) : (
        <QuickActions
          onRefresh={handleRefresh}
          onExport={handleExport}
          onFilter={handleFilter}
          cargando={isRefreshing || cargando}
          filtrosActivos={filtros.busqueda !== '' || filtros.tiendas.length > 0 || filtros.rangoFecha !== 'todo' || filtros.precioMin !== null || filtros.precioMax !== null}
        />
      )}

      {/* Panel de Filtros - Mostrar para base_datos también */}
      {showFilters && (
        <FilterPanel
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onReset={() => {
            const { resetFiltros } = useDashboardStore.getState();
            resetFiltros();
          }}
          tiendasUnicas={tiendasUnicas}
          compras={compras}
        />
      )}

      {/* Tabs Navigation */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <DataTableWrapper
          activeTab={activeTab}
          activeTabDescription={TABS.find(t => t.id === activeTab)?.description}
          activeTabIcon={(() => {
            const IconComponent = TABS.find(t => t.id === activeTab)?.icon || Table;
            return <IconComponent className="w-5 h-5" />;
          })()}
          comprasParaTablaLength={comprasParaTabla.length}
          comprasLength={compras.length}
        >
          {showSkeletons ? (
            <TableSkeleton />
          ) : (
            <DataTable
              activeTab={activeTab}
              datosTabla={datosTabla}
              numRows={numRows}
              numFilasBaseDatos={numFilasBaseDatos}
              comprasParaTabla={comprasParaTabla}
              compras={compras}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </DataTableWrapper>
      </div>
    </div>
  );
}
