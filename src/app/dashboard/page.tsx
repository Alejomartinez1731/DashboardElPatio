'use client';
import { generalLogger } from '@/lib/logger';

import { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { FilterPanel } from '@/components/dashboard/filter-panel';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
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
import { useDashboardStore, type SortField } from '@/store/useDashboardStore';
import { parsearFecha } from '@/lib/parsers';
import { useToast } from '@/components/ui/toast';

export default function DashboardPage() {
  // Hook personalizado para obtener datos de Sheets
  // Filtramos tabs que tienen sheetName (excluimos recordatorios que es navegable)
  // Memoizamos para evitar re-creación en cada render (causaría infinite loop en useSheetData)
  const tabsConfig = useMemo(() =>
    TABS
      .filter(tab => tab.sheetName)
      .map(tab => ({
        id: tab.id,
        sheetName: tab.sheetName!,
        dataKey: tab.sheetName === 'base_datos' ? 'base_de_datos' : tab.sheetName!,
      })),
    [] // TABS es una constante, no necesita dependencias
  );

  const {
    compras,
    sheetsData,
    kpiData,
    loading: cargando,
    error,
    refetch,
    isUsingMock,
    dataSource,
    warning,
  } = useSheetData(tabsConfig);

  // Zustand store - ahora incluye comprasFiltradas y ordenamiento
  const {
    activeTab,
    setActiveTab,
    filtros,
    setFiltros,
    showFilters,
    setShowFilters,
    comprasFiltradas, // Viene del store, ya filtrado y ordenado
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    setCompras, // Para actualizar el store cuando cambian las compras
  } = useDashboardStore();

  // Estado de refresco
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estado de exportación
  const [isExporting, setIsExporting] = useState(false);

  // Toast notifications
  const toast = useToast();

  // Sincronizar compras con el store cuando cambian
  useEffect(() => {
    setCompras(compras);
  }, [compras, setCompras]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    // Evitar exportaciones simultáneas
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Crear hojas para exportar: todas las pestañas disponibles
      const hojasParaExportar: { nombre: string; datos: string[][] }[] = [];

      TABS.forEach(tab => {
        const sheetName = tab.sheetName;
        if (!sheetName) return; // Skip tabs sin sheetName (recordatorios)

        const data = sheetsData[sheetName];

        if (data && data.length > 0) {
          hojasParaExportar.push({
            nombre: tab.label,
            datos: data,
          });
        }
      });

      if (hojasParaExportar.length === 0) {
        toast.warning('No hay datos para exportar');
        return;
      }

      // Exportar a Excel
      const resultado = await exportToExcel(
        hojasParaExportar,
        `dashboard_el_patio_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      if (resultado.success) {
        toast.success(resultado.message);
      } else {
        toast.error(resultado.message);
      }
    } catch (error) {
      generalLogger.error('Error inesperado al exportar:', error);
      toast.error('Error inesperado al exportar el archivo');
    } finally {
      setIsExporting(false);
    }
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

  // Función para ordenar - usa acciones del store
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

  // Usar comprasFiltradas del store (ya incluye filtros y ordenamiento)
  const numFilasFiltradas = comprasFiltradas.length;

  generalLogger.debug('Estado del dashboard:', {
    activeTab,
    activeSheetName,
    numRows,
    numFilasFiltradas,
    totalCompras: compras.length,
    filtros,
    sortField,
    sortOrder,
    sheetsDataKeys: Object.keys(sheetsData)
  });

  // Usar comprasFiltradas para base_datos (ya filtrado y ordenado por el store)
  const comprasParaTabla = activeTab === 'base_datos' ? comprasFiltradas : compras;

  // Error handler específico para el dashboard
  const handleDashboardError = (error: Error, errorInfo: React.ErrorInfo) => {
    generalLogger.error('Error en Dashboard:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      context: { activeTab, numCompras: compras.length }
    });
  };

  const comprasComoTabla = activeTab === 'base_datos'
    ? comprasParaTabla.map(c => {
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
        // Solo debug en desarrollo
        if (process.env.NODE_ENV === 'development') {
          generalLogger.debug('Row de compra:', { row, types: row.map(r => typeof r) });
        }
        return row;
      })
    : [];

  // Para base_datos, calcular el número real de filas desde compras
  const numFilasBaseDatos = activeTab === 'base_datos' ? comprasComoTabla.length : numRows;

  generalLogger.debug('Renderizando tabla:', { activeTab, activeSheetName, numRows, activeDataLength: activeData.length, numFilasBaseDatos });

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

    generalLogger.debug('Cabeceras finales para', { tab: activeTab, headers: datosTabla[0] });
  }

  if (activeTab === 'base_datos') {
    generalLogger.debug('📊 Estado de Histórico:');
    generalLogger.debug('  - comprasFiltradas.length:', comprasFiltradas.length);
    generalLogger.debug('  - compras.length:', compras.length);
    generalLogger.debug('  - comprasComoTabla.length:', comprasComoTabla.length);
    generalLogger.debug('  - datosTabla.length:', datosTabla.length);
    generalLogger.debug('  - datosTabla[0]:', datosTabla[0]);
    generalLogger.debug('  - datosTabla[1]:', datosTabla[1]);
  }

  return (
    <ErrorBoundary
      onError={handleDashboardError}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <DashboardHeader
        title="Panel General"
        description="Tablas de Google Sheets"
        statusBadge={{
          text: showSkeletons
            ? 'Cargando...'
            : isUsingMock
              ? 'Datos de prueba'
              : `Conectado a ${dataSource === 'n8n' ? 'n8n' : 'API'}`,
          color: showSkeletons
            ? 'bg-[#f59e0b]/10 border border-primary/30'
            : isUsingMock
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-[#10b981]/10 border border-[#10b981]/30'
        }}
        warning={warning}
      />

      {/* KPIs */}
      {showSkeletons ? <KPIsSkeleton /> : <DashboardKPIs kpiData={kpiData} />}

      {/* Presupuesto Mensual */}
      {showSkeletons ? <BudgetSkeleton /> : <BudgetProgress compras={compras} presupuestoInicial={3000} />}

      {/* Quick Actions */}
      {showSkeletons ? (
        <QuickActionsSkeleton />
      ) : (
        <QuickActions
          onRefresh={handleRefresh}
          onExport={handleExport}
          onFilter={handleFilter}
          cargando={isRefreshing || cargando}
          exportando={isExporting}
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
    </ErrorBoundary>
  );
}
