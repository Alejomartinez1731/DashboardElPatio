import { create } from 'zustand';
import { Compra, KPIData } from '@/types';

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
  activeTab: 'historico_precios',
  showFilters: false,
  loading: true,
  error: null,
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  ...initialState,

  // Acciones - Datos
  setCompras: (compras) => set({ compras: compras }),

  setComprasFiltradas: (compras) => set({ comprasFiltradas: compras }),

  setSheetsData: (data) => set({ sheetsData: data }),

  setKPIData: (data) => set({ kpiData: data }),

  // Acciones - Filtros
  setFiltros: (filtrosNuevos) => set((state) => ({
    filtros: { ...state.filtros, ...filtrosNuevos },
  })),

  resetFiltros: () => set({
    filtros: initialState.filtros,
  }),

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
