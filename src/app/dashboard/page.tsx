'use client';
import { generalLogger } from '@/lib/logger';

import { useEffect, useMemo, useState } from 'react';
import type { ErrorInfo } from 'react';
import { ErrorBoundary } from '@/components/error/error-boundary';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { FilterPanel } from '@/components/dashboard/filter-panel';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { ComparacionPeriodoCard } from '@/components/dashboard/comparacion-periodo-card';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardKPIs } from '@/components/dashboard/dashboard-kpis';
import { KPIsPrincipales } from '@/components/dashboard/dashboard-kpis-principales';
import { DashboardTabs, TABS } from '@/components/dashboard/dashboard-tabs';
import { DataTable, DataTableWrapper } from '@/components/dashboard/data-table';
import { KPIsSkeleton, BudgetSkeleton, TableSkeleton, QuickActionsSkeleton } from '@/components/dashboard/dashboard-skeletons';
import { exportToExcel, crearHojaExcel } from '@/lib/export-excel';
import { categorizarProducto } from '@/lib/categorias';
import { Compra, KPIData, CATEGORIAS_INFO } from '@/types';
import { normalizarTienda } from '@/lib/data-utils';
import { Table } from 'lucide-react';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { useSupabaseDashboard } from '@/hooks/useSupabaseDashboard';
import { useDashboardStore, type SortField } from '@/store/useDashboardStore';
import { parsearFecha } from '@/lib/parsers';
import { useToast } from '@/components/ui/toast';

export default function DashboardPage() {
  // Configuración de tabs para compatibilidad con useSupabaseDashboard
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

  // Obtener datos desde Supabase
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
  } = useSupabaseDashboard(tabsConfig);

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

  // Estado del presupuesto calculado dinámicamente
  const [presupuestoDinamico, setPresupuestoDinamico] = useState<number>(3000);
  const [presupuestoMetadata, setPresupuestoMetadata] = useState<any>(null);

  // Toast notifications
  const toast = useToast();

  // Cargar presupuesto calculado al inicio
  useEffect(() => {
    const fetchPresupuesto = async () => {
      try {
        const response = await fetch('/api/presupuesto-calculado?meses_a_considerar=3');
        const result = await response.json();

        if (result.success && result.data) {
          setPresupuestoDinamico(result.data.monto);
          setPresupuestoMetadata({
            fuente: result.data.fuente,
            descripcion: result.data.descripcion,
            metadata: result.data.metadata,
          });
          generalLogger.info('Presupuesto cargado:', result.data);
        }
      } catch (error) {
        generalLogger.error('Error cargando presupuesto:', error);
      }
    };

    fetchPresupuesto();
  }, []);

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

  // Obtener tiendas únicas de TODOS los datos disponibles (compras + sheetsData)
  // Memoizar extensamente para evitar recalcular con cada cambio
  const tiendasUnicas = useMemo(() => {
    const tiendasSet = new Set<string>();
    const tiendasOriginalesSet = new Set<string>();

    // Añadir tiendas desde compras (Supabase)
    compras.forEach(c => {
      const tiendaNormalizada = normalizarTienda(c.tienda);
      tiendasSet.add(tiendaNormalizada);
      tiendasOriginalesSet.add(c.tienda); // Guardar original también para debug
    });

    console.log('🔍 Tiendas desde compras:', Array.from(tiendasSet));
    console.log('🔍 Tiendas originales desde compras:', Array.from(tiendasOriginalesSet));

    // Añadir tiendas desde sheetsData (incluye registro_diario)
    // Pero solo si sheetsData tiene datos (evitar recalcular innecesariamente)
    if (sheetsData && Object.keys(sheetsData).length > 0) {
      Object.entries(sheetsData).forEach(([sheetName, data]) => {
        if (data && data.length > 1) { // length > 1 para saltar cabeceras
          const tiendaIdx = data[0]?.findIndex((h: string) => h.toLowerCase().includes('tienda'));
          if (tiendaIdx !== undefined && tiendaIdx >= 0) {
            for (let i = 1; i < data.length; i++) {
              const tienda = data[i][tiendaIdx];
              if (tienda) {
                const tiendaNormalizada = normalizarTienda(tienda);
                tiendasSet.add(tiendaNormalizada);
                tiendasOriginalesSet.add(tienda);
              }
            }
          }
          console.log(`🔍 Tiendas desde sheet [${sheetName}]:`, Array.from(tiendasSet));
        }
      });
    }

    const resultado = Array.from(tiendasSet).sort();
    console.log('✅ Tiendas únicas FINAL:', resultado.length, resultado);
    console.log('✅ Todas las tiendas originales:', Array.from(tiendasOriginalesSet));
    return resultado;
  }, [compras.length, JSON.stringify(compras.slice(0, 5)), Object.keys(sheetsData).length]); // Depender de longitudes y muestra, no de referencias de objetos

  // Debug: log tiendas únicas
  console.log('🏪 Tiendas únicas encontradas:', tiendasUnicas);
  console.log('🏪 Total compras:', compras.length);
  console.log('🏪 SheetsData keys:', Object.keys(sheetsData));
  console.log('🏪 Tiendas originales (primeras 10):', compras.slice(0, 10).map(c => c.tienda));

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

  // DEBUG LOG
  generalLogger.debug('📊 Estado del Dashboard:', {
    activeTab,
    activeSheetName,
    comprasLength: compras.length,
    comprasFiltradasLength: comprasFiltradas.length,
    numRows,
    activeDataLength: activeData.length,
    sheetsDataKeys: Object.keys(sheetsData),
    firstCompra: compras[0],
  });

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
  let comprasParaTabla = activeTab === 'base_datos' ? comprasFiltradas : compras;

  // Para base_datos, filtrar adicionalmente por la última fecha disponible
  if (activeTab === 'base_datos' && comprasParaTabla.length > 0) {
    // Encontrar la última fecha (máxima) entre las compras
    const ultimaFecha = comprasParaTabla.reduce((max, compra) => {
      const fechaCompra = new Date(compra.fecha);
      return fechaCompra > max ? fechaCompra : max;
    }, new Date(0));

    // Filtrar para mostrar solo compras de esa fecha (ignorando hora)
    const inicioDia = new Date(ultimaFecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(ultimaFecha);
    finDia.setHours(23, 59, 59, 999);

    comprasParaTabla = comprasParaTabla.filter(compra => {
      const fechaCompra = new Date(compra.fecha);
      return fechaCompra >= inicioDia && fechaCompra <= finDia;
    });

    generalLogger.debug('📅 Filtrando base_datos por última fecha:', {
      ultimaFecha: ultimaFecha.toISOString(),
      inicioDia: inicioDia.toISOString(),
      finDia: finDia.toISOString(),
      comprasAntes: comprasFiltradas.length,
      comprasDespues: comprasParaTabla.length
    });
  }

  // DEBUG LOG CRÍTICO
  generalLogger.debug('📊 ESTADO CRÍTICO:', {
    activeTab,
    expectedTab: 'base_datos',
    tabsMatch: activeTab === 'base_datos',
    comprasLength: compras.length,
    comprasFiltradasLength: comprasFiltradas.length,
    comprasParaTablaLength: comprasParaTabla.length,
    primeraCompra: compras[0],
    primeraCompraFiltrada: comprasFiltradas[0],
  });

  // Error handler específico para el dashboard
  const handleDashboardError = (error: Error, errorInfo: ErrorInfo) => {
    generalLogger.error('Error en Dashboard:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
      context: { activeTab, numCompras: compras.length }
    });
  };

  const comprasComoTabla = activeTab === 'base_datos'
    ? comprasParaTabla.map((c, idx) => {
        try {
          const categoria = categorizarProducto(c.producto);
          const categoriaInfo = CATEGORIAS_INFO[categoria];
          const row = [
            formatearFecha(c.fecha),
            c.tienda || '',
            c.producto || '',
            `${categoriaInfo?.icono || ''} ${categoriaInfo?.nombre || ''}`,
            c.precioUnitario?.toFixed(2).replace('.00', '') || '0',
            c.cantidad?.toString() || '0',
            c.total?.toFixed(2).replace('.00', '') || '0',
            c.telefono || '',
            c.direccion || ''
          ];

          // Log primera compra para debug
          if (idx === 0) {
            generalLogger.debug('📄 Primera compra como tabla:', {
              compraOriginal: c,
              row,
              categoria,
            });
          }

          return row;
        } catch (err) {
          generalLogger.error('Error procesando compra:', { compra: c, error: err });
          return [];
        }
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

  // DEBUG LOG - Ver datos que se van a renderizar
  generalLogger.debug('📊 Datos a renderizar:', {
    activeTab,
    comprasLength: compras.length,
    comprasFiltradasLength: comprasFiltradas.length,
    comprasComoTablaLength: comprasComoTabla.length,
    datosTablaLength: datosTabla.length,
    primeraFila: datosTabla[0],
    tieneDatos: datosTabla.length > 1,
  });

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
      <div className="space-y-6 animate-fade-in overflow-x-hidden">
      {/* Header */}
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <DashboardHeader
          title="Panel General"
          description="Base de datos Supabase"
          statusBadge={{
            text: showSkeletons
              ? 'Cargando...'
              : isUsingMock
                ? 'Datos de prueba'
                : 'Conectado a Supabase',
            color: showSkeletons
              ? 'bg-[#f59e0b]/10 border border-primary/30'
              : isUsingMock
                ? 'bg-amber-500/10 border border-amber-500/30'
                : 'bg-[#10b981]/10 border border-[#10b981]/30'
          }}
          warning={warning}
        />
      </ErrorBoundary>

      {/* KPIs Principales - Solo 4 KPIs importantes */}
      {showSkeletons ? (
        <KPIsSkeleton />
      ) : (
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <KPIsPrincipales
            presupuesto={presupuestoDinamico}
            gastoQuincenal={kpiData?.gastoQuincenal}
            facturasProcesadas={kpiData?.facturasProcesadas}
            recordatorios={kpiData?.numeroDeRecordatorios}
          />
        </ErrorBoundary>
      )}

      {/* Presupuesto Mensual */}
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        {showSkeletons ? <BudgetSkeleton /> : <BudgetProgress compras={compras} />}
      </ErrorBoundary>

      {/* Comparación de Período */}
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
        <ComparacionPeriodoCard />
      </ErrorBoundary>

      {/* Quick Actions */}
      {showSkeletons ? (
        <QuickActionsSkeleton />
      ) : (
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <QuickActions
            onRefresh={handleRefresh}
            onExport={handleExport}
            onFilter={handleFilter}
            cargando={isRefreshing || cargando}
            exportando={isExporting}
            filtrosActivos={filtros.busqueda !== '' || filtros.tiendas.length > 0 || filtros.rangoFecha !== 'todo' || filtros.precioMin !== null || filtros.precioMax !== null}
          />
        </ErrorBoundary>
      )}

      {/* Panel de Filtros - Mostrar para base_datos también */}
      {showFilters && (
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
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
        </ErrorBoundary>
      )}

      {/* Tabs Navigation */}
      <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
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
      </ErrorBoundary>
    </div>
    </ErrorBoundary>
  );
}
