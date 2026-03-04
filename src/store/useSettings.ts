import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Preferencias de tema
  theme: 'light' | 'dark' | 'system';

  // Preferencias de notificaciones
  enableNotifications: boolean;
  autoRefresh: boolean;
  autoRefreshInterval: number; // en segundos

  // Preferencias de visualización
  defaultView: 'tablas' | 'tarjetas';
  itemsPerPage: number;

  // Preferencias de datos
  includeRecordatorios: boolean;

  // Acciones
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setEnableNotifications: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setAutoRefreshInterval: (interval: number) => void;
  setDefaultView: (view: 'tablas' | 'tarjetas') => void;
  setItemsPerPage: (items: number) => void;
  setIncludeRecordatorios: (include: boolean) => void;

  // Reset
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'system' as const,
  enableNotifications: true,
  autoRefresh: false,
  autoRefreshInterval: 300, // 5 minutos
  defaultView: 'tablas' as const,
  itemsPerPage: 25,
  includeRecordatorios: true,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      // Valores iniciales
      ...defaultSettings,

      // Acciones
      setTheme: (theme) => set({ theme }),
      setEnableNotifications: (enableNotifications) => set({ enableNotifications }),
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setAutoRefreshInterval: (autoRefreshInterval) => set({ autoRefreshInterval }),
      setDefaultView: (defaultView) => set({ defaultView }),
      setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),
      setIncludeRecordatorios: (includeRecordatorios) => set({ includeRecordatorios }),

      // Reset a valores por defecto
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
    }
  )
);
