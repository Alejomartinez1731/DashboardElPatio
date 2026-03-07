import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecordatoriosConfigStore {
  // Estado: si los recordatorios automáticos están activados
  automaticosActivados: boolean;

  // Acción: toggle del estado
  toggleAutomaticos: () => void;

  // Acción: establecer el estado directamente
  setAutomaticosActivados: (activado: boolean) => void;
}

export const useRecordatoriosConfig = create<RecordatoriosConfigStore>()(
  persist(
    (set) => ({
      // Inicializar desde useSettings si existe, si no false
      automaticosActivados: (() => {
        if (typeof window !== 'undefined') {
          const settings = localStorage.getItem('settings-storage');
          if (settings) {
            try {
              const parsed = JSON.parse(settings);
              return parsed.state.includeRecordatorios ?? false;
            } catch {
              return false;
            }
          }
        }
        return false;
      })(),

      toggleAutomaticos: () =>
        set((state) => {
          const newValue = !state.automaticosActivados;

          // También actualizar en useSettings
          if (typeof window !== 'undefined') {
            const settings = localStorage.getItem('settings-storage');
            if (settings) {
              try {
                const parsed = JSON.parse(settings);
                parsed.state.includeRecordatorios = newValue;
                localStorage.setItem('settings-storage', JSON.stringify(parsed));
                // Disparar evento para que otros componentes se actualicen
                window.dispatchEvent(new Event('settings-changed'));
              } catch (e) {
                console.warn('No se pudo sincronizar con settings:', e);
              }
            }
          }

          return { automaticosActivados: newValue };
        }),

      setAutomaticosActivados: (activado) =>
        set(() => {
          // También actualizar en useSettings
          if (typeof window !== 'undefined') {
            const settings = localStorage.getItem('settings-storage');
            if (settings) {
              try {
                const parsed = JSON.parse(settings);
                parsed.state.includeRecordatorios = activado;
                localStorage.setItem('settings-storage', JSON.stringify(parsed));
                // Disparar evento para que otros componentes se actualicen
                window.dispatchEvent(new Event('settings-changed'));
              } catch (e) {
                console.warn('No se pudo sincronizar con settings:', e);
              }
            }
          }

          return { automaticosActivados: activado };
        }),
    }),
    {
      name: 'recordatorios-config-storage', // Key para localStorage
    }
  )
);
