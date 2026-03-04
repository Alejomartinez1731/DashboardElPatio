import { useState, useEffect, useCallback, startTransition, useRef } from 'react';
import { Compra, KPIData, SheetName, Recordatorio } from '@/types';
import { parsearFecha, excluirFilaResumenConLog, normalizarCabeceras, filaAObjeto } from '@/lib/parsers';
import { calcularKPIs } from '@/lib/data-utils';
import { apiLogger } from '@/lib/logger';
import { fetchWithCache, apiCache } from '@/lib/cache';

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
   * Procesa filas de forma directa (sin chunking) - más rápido para datasets pequeños
   */
  const procesarFilasDirecto = useCallback((values: string[][], cabeceras: string[]): Compra[] => {
    const inicio = Date.now();
    const comprasProcesadas: Compra[] = [];

    for (let i = 1; i < values.length; i++) {
      const fila = values[i] as any[];
      const obj = filaAObjeto(fila, cabeceras);

      const compra: Compra = {
        id: `compra-${i}-${Date.now()}`,
        fecha: parsearFecha(String(obj.fecha || '')),
        tienda: String(obj.tienda || ''),
        producto: String(obj.descripcion || ''),
        cantidad: parseFloat(String(obj.cantidad || '0')) || 0,
        precioUnitario: parseFloat(String(obj['precio_unitario'] || obj['precio unitario'] || '0')) || 0,
        total: parseFloat(String(obj.total || '0')) || 0,
        telefono: obj.telefono ? String(obj.telefono) : undefined,
        direccion: obj.direccion ? String(obj.direccion) : undefined,
      };

      if (!excluirFilaResumenConLog(compra.producto)) {
        comprasProcesadas.push(compra);
      }
    }

    const tiempoTotal = Date.now() - inicio;
    apiLogger.debug(`✅ ${comprasProcesadas.length} compras procesadas en ${tiempoTotal}ms (directo)`);

    return comprasProcesadas;
  }, []);

  /**
   * Finaliza la carga de datos
   */
  const finalizarCarga = useCallback((
    comprasProcesadas: Compra[],
    allData: Record<string, string[][]>,
    result: SheetsApiResponse,
    numeroDeRecordatorios: number
  ) => {
    // Obtener datos adicionales para KPIs
    const historicoPreciosValues = (result.data.historico_precios?.values) || [];
    const registroDiarioValues = (result.data.registro_diario?.values) || [];

    // Calcular KPIs
    const kpis = calcularKPIs(comprasProcesadas, historicoPreciosValues, registroDiarioValues, numeroDeRecordatorios);

    // Actualizar estado (batched en una sola transición)
    if (isMountedRef.current) {
      startTransition(() => {
        setCompras(comprasProcesadas);
        setComprasFiltradas(comprasProcesadas);
        setSheetsData(allData);
        setKpiData(kpis);
      });
    }
  }, []);

  /**
   * Obtiene el número de recordatorios (con caché)
   */
  const fetchNumeroDeRecordatorios = useCallback(async (): Promise<number> => {
    try {
      const resp = await fetchWithCache(
        'recordatorios_count',
        async () => {
          const response = await fetch('/api/recordatorios?incluirAutomaticos=true');
          if (!response.ok) throw new Error('Error fetching recordatorios');
          return response.json();
        },
        2 // 2 minutos de caché
      );

      if (resp.success) {
        const importantes = resp.data.filter((r: Recordatorio) =>
          r.estado === 'vencido' || r.estado === 'proximo' || r.estado === 'sin_datos'
        );
        return importantes.length;
      }
    } catch (error) {
      apiLogger.warn('No se pudieron obtener recordatorios:', error);
    }
    return 0;
  }, []);

  /**
   * Procesa filas en chunks para no bloquear el UI
   */
  const procesarFilasConChunking = useCallback((
    values: string[][],
    cabeceras: string[],
    allData: Record<string, string[][]>,
    apiResult: SheetsApiResponse,
    usarChunking: boolean,
    onProcesamientoCompletado: (comprasProcesadas: Compra[]) => void
  ) => {
    const comprasProcesadas: Compra[] = [];
    const inicio = Date.now();

    const procesarChunk = (chunkInicio: number): void => {
      // Si el componente se desmontó, detener procesamiento
      if (!isMountedRef.current) {
        apiLogger.debug('⏹️ Componente desmontado, deteniendo procesamiento');
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
          fecha: parsearFecha(String(obj.fecha || '')),
          tienda: String(obj.tienda || ''),
          producto: String(obj.descripcion || ''),
          cantidad: parseFloat(String(obj.cantidad || '0')) || 0,
          precioUnitario: parseFloat(String(obj['precio_unitario'] || obj['precio unitario'] || '0')) || 0,
          total: parseFloat(String(obj.total || '0')) || 0,
          telefono: obj.telefono ? String(obj.telefono) : undefined,
          direccion: obj.direccion ? String(obj.direccion) : undefined,
        };

        // Excluir filas de resumen
        if (!excluirFilaResumenConLog(compra.producto)) {
          comprasProcesadas.push(compra);
        }
      }

      // Log de progreso
      const progreso = Math.round((chunkFin / values.length) * 100);
      apiLogger.debug(`📊 Procesando... ${progreso}% (${comprasProcesadas.length} compras)`);

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
        apiLogger.debug(`✅ ${comprasProcesadas.length} compras procesadas en ${tiempoTotal}ms`);

        // Llamar callback cuando el procesamiento se completa
        onProcesamientoCompletado(comprasProcesadas);
      }
    };

    // Iniciar procesamiento desde la fila 1 (saltar cabecera)
    procesarChunk(1);
  }, []);

  /**
   * Obtiene datos de la API y los procesa (optimizado con fetch paralelo y caché)
   */
  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      // 🚀 FETCH PARALELO: Hacer ambos fetches al mismo tiempo
      // Primero intentamos obtener del caché para ver si hay datos mock ahí
      const cachedData = apiCache.get<SheetsApiResponse>('sheets_data');
      const skipCache = cachedData?._isMock === true; // Forzar refresco si el caché tiene datos mock

      const [result, numeroDeRecordatorios] = await Promise.all([
        // Fetch principal con caché de 3 minutos
        fetchWithCache(
          'sheets_data',
          async () => {
            const response = await fetch('/api/sheets');
            if (!response.ok) {
              throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json() as Promise<SheetsApiResponse>;
          },
          3, // 3 minutos de caché
          skipCache // Forzar nuevo fetch si el caché tenía datos mock
        ),
        // Fetch de recordatorios en paralelo
        fetchNumeroDeRecordatorios(),
      ]);

      // Actualizar metadata de fuente de datos
      setIsUsingMock(result._isMock || false);
      setDataSource(result._source || 'n8n');
      setWarning(result._warning || null);

      // ⚠️ Si son datos mock, limpiar el caché para no persistirlos
      if (result._isMock) {
        apiLogger.warn('⚠️ Usando datos MOCK:', result._warning);
        apiCache.delete('sheets_data'); // Limpiar caché para que la próxima vez haga fetch nuevo
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

      // 2. Procesar compras desde base_de_datos
      const hojaBaseDatos = result.data.base_de_datos || result.data.historico;

      if (hojaBaseDatos?.values && Array.isArray(hojaBaseDatos.values)) {
        const values = hojaBaseDatos.values;

        if (values.length > 1) {
          // Normalizar cabeceras
          const cabeceras = normalizarCabeceras(values[0] as string[]);

          apiLogger.debug('📊 Cabeceras normalizadas:', cabeceras);
          apiLogger.debug(`📊 Total de filas a procesar: ${values.length - 1}`);

          // 🚀 OPTIMIZACIÓN: Procesar directamente sin chunking para datasets < 500 filas
          const filasAProcesar = values.length - 1;
          const usarChunking = filasAProcesar > 500; // Aumentado de CHUNK_SIZE a 500

          if (usarChunking) {
            apiLogger.debug(`🚀 Usando procesamiento por chunks (${CHUNK_SIZE} filas/chunk)`);
          }

          // Procesar filas
          if (usarChunking) {
            // Con chunking para datasets grandes
            procesarFilasConChunking(values, cabeceras, allData, result, true, (comprasProcesadas) => {
              finalizarCarga(comprasProcesadas, allData, result, numeroDeRecordatorios);
            });
          } else {
            // 🚀 Procesamiento directo para datasets pequeños (más rápido)
            const comprasProcesadas = procesarFilasDirecto(values, cabeceras);
            finalizarCarga(comprasProcesadas, allData, result, numeroDeRecordatorios);
          }
        }
      } else {
        apiLogger.warn('⚠️ No hay datos en base_de_datos');
        startTransition(() => {
          setCompras([]);
          setComprasFiltradas([]);
          setSheetsData(allData);
          setKpiData({
            gastoQuincenal: 0,
            facturasProcesadas: 0,
            numeroDeRecordatorios,
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      apiLogger.error('❌ Error en useSheetData:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tabs, procesarFilasConChunking, fetchNumeroDeRecordatorios, procesarFilasDirecto, finalizarCarga]);

  /**
   * Función para refrescar datos manualmente
   */
  const refetch = useCallback(async () => {
    apiLogger.debug('🔄 Refrescando datos...');
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
