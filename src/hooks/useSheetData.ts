import { useState, useEffect, useCallback, startTransition, useRef } from 'react';
import { Compra, KPIData, SheetName } from '@/types';
import { parsearFecha, excluirFilaResumenConLog, normalizarCabeceras, filaAObjeto } from '@/lib/parsers';
import { calcularKPIs } from '@/lib/data-utils';

export interface SheetData {
  values: string[][];
}

export interface SheetsApiResponse {
  success: boolean;
  data: Record<string, SheetData>;
  message?: string;
  error?: string;
  _source?: 'n8n' | 'mock';
  _isMock?: boolean;
  _warning?: string;
  _n8nError?: string;
  _n8nErrorType?: string;
  _n8nAttempts?: number;
}

export interface UseSheetDataResult {
  compras: Compra[];
  comprasFiltradas: Compra[];
  sheetsData: Record<string, string[][]>;
  kpiData: KPIData | null;
  loading: boolean;
  error: string | null;
  isUsingMock: boolean;
  dataSource: 'n8n' | 'mock';
  warning: string | null;
  refetch: () => Promise<void>;
}

export interface TabConfig {
  id: string;
  sheetName: SheetName;
  dataKey: string;
}

// Configuración de procesamiento por chunks
const CHUNK_SIZE = 100; // Filas a procesar por chunk
const USE_CHUNKING = true; // Habilitar procesamiento por chunks

/**
 * Hook personalizado para obtener y procesar datos de Google Sheets vía API
 *
 * @param tabs - Configuración de pestañas a cargar
 * @returns Objeto con datos, estado de carga y función de refresco
 */
export function useSheetData(tabs: TabConfig[]): UseSheetDataResult {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [comprasFiltradas, setComprasFiltradas] = useState<Compra[]>([]);
  const [sheetsData, setSheetsData] = useState<Record<string, string[][]>>({});
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [dataSource, setDataSource] = useState<'n8n' | 'mock'>('n8n');
  const [warning, setWarning] = useState<string | null>(null);

  // Ref para abortar procesamiento si se desmonta el componente
  const isMountedRef = useRef(true);

  /**
   * Procesa filas en chunks para no bloquear el UI
   */
  const procesarFilasConChunking = useCallback((
    values: string[][],
    cabeceras: string[],
    allData: Record<string, string[][]>,
    apiResult: SheetsApiResponse,
    usarChunking: boolean
  ) => {
    const comprasProcesadas: Compra[] = [];
    const inicio = Date.now();

    const procesarChunk = (chunkInicio: number): void => {
      // Si el componente se desmontó, detener procesamiento
      if (!isMountedRef.current) {
        console.log('⏹️ Componente desmontado, deteniendo procesamiento');
        return;
      }

      const chunkFin = Math.min(chunkInicio + CHUNK_SIZE, values.length);

      // Procesar este chunk
      for (let i = chunkInicio; i < chunkFin; i++) {
        if (i === 0) continue; // Saltar cabecera

        const fila = values[i] as any[];
        const obj = filaAObjeto(fila, cabeceras);

        // Crear objeto Compra
        const compra: Compra = {
          id: `compra-${i}-${Date.now()}`,
          fecha: parsearFecha(obj.fecha || ''),
          tienda: obj.tienda || '',
          producto: obj.descripcion || '',
          cantidad: parseFloat(obj.cantidad || '0') || 0,
          precioUnitario: parseFloat(obj['precio_unitario'] || obj['precio unitario'] || '0') || 0,
          total: parseFloat(obj.total || '0') || 0,
          telefono: obj.telefono,
          direccion: obj.direccion,
        };

        // Excluir filas de resumen
        if (!excluirFilaResumenConLog(compra.producto)) {
          comprasProcesadas.push(compra);
        }
      }

      // Log de progreso
      const progreso = Math.round((chunkFin / values.length) * 100);
      console.log(`📊 Procesando... ${progreso}% (${comprasProcesadas.length} compras)`);

      // Si quedan más filas, programar siguiente chunk
      if (chunkFin < values.length) {
        if (usarChunking) {
          // Usar requestIdleCallback para no bloquear el UI
          requestIdleCallback(() => procesarChunk(chunkFin), { timeout: 100 });
        } else {
          // Procesamiento directo (para datasets pequeños)
          procesarChunk(chunkFin);
        }
      } else {
        // Terminó el procesamiento de todas las filas
        const tiempoTotal = Date.now() - inicio;
        console.log(`✅ ${comprasProcesadas.length} compras procesadas en ${tiempoTotal}ms`);

        // 3. Obtener datos adicionales para KPIs
        const historicoPreciosValues = (apiResult.data.historico_precios?.values) || [];
        const registroDiarioValues = (apiResult.data.registro_diario?.values) || [];

        // 4. Calcular KPIs
        const kpis = calcularKPIs(comprasProcesadas, historicoPreciosValues, registroDiarioValues);

        // 5. Actualizar estado (batched en una sola transición)
        if (isMountedRef.current) {
          startTransition(() => {
            setCompras(comprasProcesadas);
            setComprasFiltradas(comprasProcesadas);
            setSheetsData(allData);
            setKpiData(kpis);
          });
        }
      }
    };

    // Iniciar procesamiento desde la fila 1 (saltar cabecera)
    procesarChunk(1);
  }, []);

  /**
   * Obtiene datos de la API y los procesa
   */
  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      const response = await fetch('/api/sheets');

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SheetsApiResponse = await response.json();

      // Actualizar metadata de fuente de datos
      setIsUsingMock(result._isMock || false);
      setDataSource(result._source || 'n8n');
      setWarning(result._warning || null);

      // Mostrar advertencia si usa mock (no es un error, pero es info importante)
      if (result._isMock) {
        console.warn('⚠️ Usando datos MOCK:', result._warning);
      }

      if (!result.success) {
        throw new Error(result.message || result.error || 'Error desconocido al obtener datos');
      }

      // 1. Extraer datos crudos de cada hoja
      const allData: Record<string, string[][]> = {};
      tabs.forEach(tab => {
        const sheetData = result.data[tab.dataKey];
        if (sheetData?.values && Array.isArray(sheetData.values)) {
          allData[tab.sheetName] = sheetData.values;
        } else {
          allData[tab.sheetName] = [];
        }
      });

      console.log('📊 sheetsData extraído:', Object.keys(allData));

      // 2. Procesar compras desde base_de_datos
      const hojaBaseDatos = result.data.base_de_datos || result.data.historico;

      if (hojaBaseDatos?.values && Array.isArray(hojaBaseDatos.values)) {
        const values = hojaBaseDatos.values;

        if (values.length > 1) {
          // Normalizar cabeceras
          const cabeceras = normalizarCabeceras(values[0] as string[]);

          console.log('📊 Cabeceras normalizadas:', cabeceras);
          console.log(`📊 Total de filas a procesar: ${values.length - 1}`);

          // Decidir si usar chunking o procesamiento directo
          const filasAProcesar = values.length - 1;
          const usarChunking = USE_CHUNKING && filasAProcesar > CHUNK_SIZE;

          if (usarChunking) {
            console.log(`🚀 Usando procesamiento por chunks (${CHUNK_SIZE} filas/chunk)`);
          }

          // Procesar filas (con chunks o directo)
          procesarFilasConChunking(values, cabeceras, allData, result, usarChunking);
        }
      } else {
        console.warn('⚠️ No hay datos en base_de_datos');
        startTransition(() => {
          setCompras([]);
          setComprasFiltradas([]);
          setSheetsData(allData);
          setKpiData({
            gastoQuincenal: 0,
            facturasProcesadas: 0,
            alertasDePrecio: 0,
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Error en useSheetData:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tabs, procesarFilasConChunking]);

  /**
   * Función para refrescar datos manualmente
   */
  const refetch = useCallback(async () => {
    console.log('🔄 Refrescando datos...');
    await fetchDatos();
  }, [fetchDatos]);

  // Efecto principal: cargar datos al montar o cuando cambia tabs
  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  // Limpiar ref al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    compras,
    comprasFiltradas,
    sheetsData,
    kpiData,
    loading,
    error,
    isUsingMock,
    dataSource,
    warning,
    refetch,
  };
}

/**
 * Hook simplificado que retorna solo las compras procesadas
 */
export function useCompras(tabs: TabConfig[]): {
  compras: Compra[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { compras, loading, error, refetch } = useSheetData(tabs);
  return { compras, loading, error, refetch };
}

/**
 * Hook simplificado que retorna solo los datos crudos de las hojas
 */
export function useSheetsData(tabs: TabConfig[]): {
  sheetsData: Record<string, string[][]>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { sheetsData, loading, error, refetch } = useSheetData(tabs);
  return { sheetsData, loading, error, refetch };
}
