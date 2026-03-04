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
      automaticosActivados: false, // Por defecto desactivados

      toggleAutomaticos: () =>
        set((state) => ({
          automaticosActivados: !state.automaticosActivados,
        })),

      setAutomaticosActivados: (activado) =>
        set({
          automaticosActivados: activado,
        }),
    }),
    {
      name: 'recordatorios-config-storage', // Key para localStorage
    }
  )
);
