/**
 * Hook para usar el Web Worker de procesamiento de datos
 */

import { useEffect, useRef, useCallback } from 'react';

type WorkerMessageType = 'filter' | 'sort' | 'calculate-kpis' | 'process-raw-data';

interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  data: any;
}

interface WorkerResponse {
  type: 'success' | 'error';
  id: string;
  result?: any;
  error?: string;
}

export function useDataProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacksRef = useRef<Map<string, (result: any, error?: string) => void>>(new Map());

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
    <T = any,>(
      type: WorkerMessageType,
      data: any,
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
        pendingCallbacksRef.current.set(id, (result: any, error?: string) => {
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
    (compras: any[], filtros: any) => {
      return processInWorker<any[]>('filter', { compras, filtros });
    },
    [processInWorker]
  );

  const sortCompras = useCallback(
    (compras: any[], sortField: string, sortOrder: 'asc' | 'desc') => {
      return processInWorker<any[]>('sort', { compras, sortField, sortOrder });
    },
    [processInWorker]
  );

  const calculateKPIs = useCallback(
    (compras: any[]) => {
      return processInWorker<any>('calculate-kpis', { compras });
    },
    [processInWorker]
  );

  const processRawData = useCallback(
    (values: string[][], sheetName: string) => {
      return processInWorker<any[]>('process-raw-data', { values, sheetName });
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
