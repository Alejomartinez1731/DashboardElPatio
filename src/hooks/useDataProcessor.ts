/**
 * Hook para usar el Web Worker de procesamiento de datos
 */

import { useEffect, useRef, useCallback } from 'react';
import { generalLogger } from '@/lib/logger';
import type { Compra, KPIData } from '@/types';

type WorkerMessageType = 'filter' | 'sort' | 'calculate-kpis' | 'process-raw-data';

interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  data: unknown;
}

interface WorkerResponse {
  type: 'success' | 'error';
  id: string;
  result?: unknown;
  error?: string;
}

export function useDataProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (result: unknown, error?: string) => void>>(new Map());

  // Inicializar worker
  useEffect(() => {
    // Crear el worker
    const worker = new Worker(new URL('../workers/data-processor.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;

    // Escuchar mensajes del worker
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, id, result, error } = event.data;

      const callback = pendingCallbacksRef.current.get(id);
      if (callback) {
        pendingCallbacksRef.current.delete(id);
        callback(result, error);
      }
    };

    worker.onerror = (error) => {
      generalLogger.error('Error en Web Worker:', error);
    };

    // Limpiar al desmontar
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Función para enviar mensajes al worker
  const processInWorker = useCallback(
    <T = unknown,>(
      type: WorkerMessageType,
      data: unknown,
      timeout: number = 5000
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const id = `${type}-${Date.now()}-${Math.random()}`;

        // Set timeout
        const timeoutId = setTimeout(() => {
          pendingCallbacksRef.current.delete(id);
          reject(new Error(`Worker timeout after ${timeout}ms`));
        }, timeout);

        // Guardar callback
        pendingCallbacksRef.current.set(id, (result: unknown, error?: string) => {
          clearTimeout(timeoutId);
          if (error) {
            reject(new Error(error));
          } else {
            resolve(result as T);
          }
        });

        // Enviar mensaje
        const message: WorkerMessage = { type, id, data };
        workerRef.current.postMessage(message);
      });
    },
    []
  );

  // Funciones específicas
  const filterCompras = useCallback(
    (compras: Compra[], filtros: Record<string, unknown>) => {
      return processInWorker<Compra[]>('filter', { compras, filtros });
    },
    [processInWorker]
  );

  const sortCompras = useCallback(
    (compras: Compra[], sortField: string, sortOrder: 'asc' | 'desc') => {
      return processInWorker<Compra[]>('sort', { compras, sortField, sortOrder });
    },
    [processInWorker]
  );

  const calculateKPIs = useCallback(
    (compras: Compra[]) => {
      return processInWorker<KPIData>('calculate-kpis', { compras });
    },
    [processInWorker]
  );

  const processRawData = useCallback(
    (values: string[][], sheetName: string) => {
      return processInWorker<Compra[]>('process-raw-data', { values, sheetName });
    },
    [processInWorker]
  );

  return {
    filterCompras,
    sortCompras,
    calculateKPIs,
    processRawData,
  };
}
