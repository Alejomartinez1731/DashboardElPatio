import { create } from 'zustand';
import { Compra, KPIData } from '@/types';
import { normalizarTienda } from '@/lib/data-utils';

export type SortField = 'fecha' | 'tienda' | 'producto' | 'cantidad' | 'precio' | 'total';

interface FiltrosDashboard {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  rangoFecha: 'todo' | 'hoy' | 'semana' | 'mes' | 'mesPasado' | 'anio';
  tiendas: string[];
  busqueda: string;
  precioMin: number | null;
  precioMax: number | null;
}

interface DashboardState {
  // Datos
  compras: Compra[];
  comprasFiltradas: Compra[];
  sheetsData: Record<string, string[][]>;
  kpiData: KPIData | null;

  // Estado de filtros
  filtros: FiltrosDashboard;

  // Ordenamiento
  sortField: SortField;
  sortOrder: 'asc' | 'desc';

  // Estado de UI
  activeTab: string;
  showFilters: boolean;

  // Estados de carga
  loading: boolean;
  error: string | null;

  // Acciones - Datos
  setCompras: (compras: Compra[]) => void;
  setComprasFiltradas: (compras: Compra[]) => void;
  setSheetsData: (data: Record<string, string[][]>) => void;
  setKPIData: (data: KPIData | null) => void;

  // Acciones - Filtros
  setFiltros: (filtros: Partial<FiltrosDashboard>) => void;
  resetFiltros: () => void;
  aplicarFiltros: () => void; // Nueva acción para recalcular compras filtradas

  // Acciones - Ordenamiento
  setSortField: (field: SortField) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Acciones - UI
  setActiveTab: (tabId: string) => void;
  setShowFilters: (show: boolean) => void;

  // Acciones - Carga
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Acciones - Refrescar
  refetchDatos: () => Promise<void>;
}

const initialState = {
  compras: [],
  comprasFiltradas: [],
  sheetsData: {},
  kpiData: null,
  filtros: {
    fechaInicio: null,
    fechaFin: null,
    rangoFecha: 'todo' as const,
    tiendas: [],
    busqueda: '',
    precioMin: null,
    precioMax: null,
  },
  sortField: 'fecha' as SortField,
  sortOrder: 'desc' as 'asc' | 'desc',
  activeTab: 'base_datos', // Cambiado de 'historico_precios'
  showFilters: false,
  loading: true,
  error: null,
};

/**
 * Aplica filtros y ordenamiento a las compras
 */
function aplicarFiltrosYOrdenamiento(
  compras: Compra[],
  filtros: FiltrosDashboard,
  sortField: SortField,
  sortOrder: 'asc' | 'desc'
): Compra[] {
  let filtradas = [...compras];

  // Filtro por rango de fechas
  if (filtros.fechaInicio) {
    const inicio = new Date(filtros.fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    filtradas = filtradas.filter(c => c.fecha >= inicio);
  }
  if (filtros.fechaFin) {
    const fin = new Date(filtros.fechaFin);
    fin.setHours(23, 59, 59, 999);
    filtradas = filtradas.filter(c => c.fecha <= fin);
  }

  // Filtro por tiendas
  if (filtros.tiendas.length > 0) {
    filtradas = filtradas.filter(c => filtros.tiendas.includes(normalizarTienda(c.tienda)));
  }

  // Filtro por búsqueda de producto
  if (filtros.busqueda) {
    const busquedaLower = filtros.busqueda.toLowerCase().trim();
    filtradas = filtradas.filter(c =>
      c.producto.toLowerCase().includes(busquedaLower)
    );
  }

  // Filtro por rango de precios
  if (filtros.precioMin !== null) {
    filtradas = filtradas.filter(c => c.precioUnitario >= filtros.precioMin!);
  }
  if (filtros.precioMax !== null) {
    filtradas = filtradas.filter(c => c.precioUnitario <= filtros.precioMax!);
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

  return filtradas;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialState,

  // Acciones - Datos
  setCompras: (compras) => {
    console.log('📊 [STORE] setCompras llamado:', {
      comprasLength: compras.length,
      activeTab: get().activeTab,
    });

    set({ compras });
    // Recalcular compras filtradas cuando cambian las compras
    get().aplicarFiltros();
  },

  setComprasFiltradas: (compras) => set({ comprasFiltradas: compras }),

  setSheetsData: (data) => set({ sheetsData: data }),

  setKPIData: (data) => set({ kpiData: data }),

  // Acciones - Filtros
  setFiltros: (filtrosNuevos) => {
    set((state) => ({
      filtros: { ...state.filtros, ...filtrosNuevos },
    }));
    // Recalcular compras filtradas cuando cambian los filtros
    get().aplicarFiltros();
  },

  resetFiltros: () => {
    set({
      filtros: initialState.filtros,
    });
    // Recalcular compras filtradas cuando se resetean los filtros
    get().aplicarFiltros();
  },

  aplicarFiltros: () => {
    const state = get();
    const filtradas = aplicarFiltrosYOrdenamiento(
      state.compras,
      state.filtros,
      state.sortField,
      state.sortOrder
    );

    // DEBUG LOG
    console.log('📊 [STORE] aplicarFiltros llamado:', {
      comprasLength: state.compras.length,
      filtradasLength: filtradas.length,
      activeTab: state.activeTab,
      filtros: state.filtros,
    });

    set({ comprasFiltradas: filtradas });
  },

  // Acciones - Ordenamiento
  setSortField: (field) => {
    set({ sortField: field });
    // Recalcular cuando cambia el campo de ordenamiento
    get().aplicarFiltros();
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
    // Recalcular cuando cambia el orden
    get().aplicarFiltros();
  },

  // Acciones - UI
  setActiveTab: (tabId) => set({ activeTab: tabId }),

  setShowFilters: (show) => set({ showFilters: show }),

  // Acciones - Carga
  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Acciones - Refrescar
  refetchDatos: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/sheets');
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }
      const result = await response.json();
      // Los datos serán procesados por el hook que usa el store
      // Esta es solo la acción de refresco
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
      });
    }
  },
}));
