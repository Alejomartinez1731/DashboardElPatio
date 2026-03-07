import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Compra, KPIData } from '@/types';
import { normalizarFecha } from '@/lib/data-utils';
import { apiLogger } from '@/lib/logger';
import { requireSupabase } from '@/lib/supabase';

export interface UseSupabaseDashboardResult {
  compras: Compra[];
  sheetsData: Record<string, string[][]>;
  kpiData: KPIData | null;
  loading: boolean;
  error: string | null;
  isUsingMock: boolean;
  dataSource: 'supabase' | 'mock';
  warning: string | null;
  refetch: () => Promise<void>;
}

interface TabConfig {
  id: string;
  sheetName: string;
  dataKey: string;
}

/**
 * Hook personalizado para obtener datos desde Supabase
 * Reemplaza useSheetData para el dashboard migrado
 */
export function useSupabaseDashboard(tabs: TabConfig[]): UseSupabaseDashboardResult {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [sheetsData, setSheetsData] = useState<Record<string, string[][]>>({});
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'mock'>('supabase');
  const [warning, setWarning] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const isFetchingRef = useRef(false);

  /**
   * Obtiene el número de recordatorios
   */
  const fetchNumeroDeRecordatorios = useCallback(async (): Promise<number> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/recordatorios?incluirAutomaticos=true', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Error fetching recordatorios');
      const result = await response.json();

      if (result.success) {
        const importantes = result.data.filter((r: any) =>
          r.estado === 'vencido' || r.estado === 'proximo' || r.estado === 'sin_datos'
        );
        return importantes.length;
      }
    } catch (error) {
      apiLogger.warn('No se pudieron obtener recordatorios:', error);
      // No lanzar error - solo log warning y retornar 0
    }
    return 0;
  }, []);

  /**
   * Convierte datos de Supabase a formato de tabla compatible con el dashboard
   */
  const convertirComprasATabla = useCallback((comprasData: any[]): string[][] => {
    if (!comprasData || comprasData.length === 0) return [];

    // Cabeceras
    const cabeceras = ['FECHA', 'TIENDA', 'PRODUCTO', 'CANTIDAD', 'PRECIO UNITARIO', 'TOTAL'];

    // Filas de datos
    const filas = comprasData.map((compra) => [
      new Date(compra.fecha).toLocaleDateString('es-ES'),
      compra.tienda || '',
      compra.descripcion || '',
      String(compra.cantidad || 0),
      String(compra.precio_unitario || 0),
      String(compra.total || 0),
    ]);

    return [cabeceras, ...filas];
  }, []);

  /**
   * Obtiene datos desde Supabase
   */
  const fetchDatos = useCallback(async () => {
    // Prevenir múltiples llamadas simultáneas usando ref
    if (isFetchingRef.current) {
      apiLogger.warn('⏸️ Ya hay una petición en curso, ignorando...');
      return;
    }

    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      // Obtener cliente de Supabase
      const supabase = requireSupabase();

      apiLogger.debug('📊 Iniciando fetch desde Supabase...');

      // Fetch paralelo con timeout y error handling
      const [comprasResult, recordatoriosCount] = await Promise.allSettled([
        // Llamada directa a Supabase con timeout
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          try {
            const result = await supabase
              .from('compras')
              .select('*')
              .order('fecha', { ascending: false })
              .limit(1000);
            clearTimeout(timeoutId);
            return result;
          } catch (err) {
            clearTimeout(timeoutId);
            throw err;
          }
        })(),
        fetchNumeroDeRecordatorios(),
      ]);

      // Manejar resultados con Promise.allSettled
      let comprasData: any[] = [];
      let comprasError: string | null = null;

      if (comprasResult.status === 'fulfilled') {
        if (comprasResult.value.error) {
          comprasError = comprasResult.value.error.message;
          apiLogger.error('❌ Error fetching compras:', comprasError);
        } else {
          comprasData = comprasResult.value.data || [];
        }
      } else {
        comprasError = comprasResult.reason?.message || 'Error desconocido';
        apiLogger.error('❌ Error fetching compras:', comprasError);
      }

      // Si hay error de Supabase, mostrar warning pero continuar
      if (comprasError) {
        const authError = comprasError.includes('Invalid authentication') || comprasError.includes('JWT');
        if (authError) {
          setError('Error de autenticación con Supabase. Por favor verifica tus credenciales JWT.');
          setWarning('Variables NEXT_PUBLIC_SUPABASE_ANON_KEY o JWT_SECRET pueden ser incorrectas.');
          apiLogger.error('❌ Error de autenticación Supabase:', {
            error: comprasError,
            hint: 'Verifica que JWT_SECRET es correcto y ANON_KEY está firmado con esa clave'
          });
          return; // Detener ejecución si hay error de auth
        }
      }

      // Procesar compras desde Supabase a formato Compra
      const comprasProcesadas: Compra[] = comprasData.map((item: any, index: number) => ({
        id: item.id || `compra-${index}-${Date.now()}`,
        fecha: normalizarFecha(item.fecha),
        tienda: item.tienda || '',
        producto: item.descripcion || '',
        cantidad: item.cantidad || 0,
        precioUnitario: item.precio_unitario || 0,
        total: item.total || 0,
        telefono: item.telefono,
        direccion: item.direccion,
      }));

      // Convertir compras a formato tabla para compatibilidad
      const tablaCompras = convertirComprasATabla(comprasProcesadas);

      // Crear sheetsData para compatibilidad con componentes existentes
      const allData: Record<string, string[][]> = {
        base_datos: tablaCompras,
        historico: tablaCompras,
      };

      // Calcular KPIs
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);

      const hace15Dias = new Date(hoy);
      hace15Dias.setDate(hace15Dias.getDate() - 15);
      hace15Dias.setHours(0, 0, 0, 0);

      const gastoQuincenal = comprasProcesadas
        .filter(c => {
          const fechaCompra = new Date(c.fecha);
          return fechaCompra >= hace15Dias && fechaCompra <= hoy;
        })
        .reduce((sum, c) => sum + c.total, 0);

      // Contar facturas únicas (fecha + tienda)
      const facturasUnicas = new Set<string>();
      comprasProcesadas.forEach(c => {
        const fechaStr = new Date(c.fecha).toDateString();
        facturasUnicas.add(`${fechaStr}-${c.tienda}`);
      });

      // Obtener recordatorios count del resultado de Promise.allSettled
      const recordatoriosCountFinal =
        recordatoriosCount.status === 'fulfilled' ? recordatoriosCount.value : 0;

      const kpis: KPIData = {
        gastoQuincenal,
        facturasProcesadas: facturasUnicas.size,
        numeroDeRecordatorios: recordatoriosCountFinal,
      };

      // Actualizar estado
      setCompras(comprasProcesadas);
      setSheetsData(allData);
      setKpiData(kpis);
      setIsUsingMock(false);
      setDataSource('supabase');
      setHasLoadedOnce(true);

      apiLogger.info('✅ Datos cargados desde Supabase:', {
        compras: comprasProcesadas.length,
        gastoQuincenal,
        facturas: facturasUnicas.size,
        recordatorios: recordatoriosCountFinal,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      apiLogger.error('❌ Error en useSupabaseDashboard:', errorMessage);
      setError(errorMessage);
      setHasLoadedOnce(true); // Marcar como cargado aunque haya error
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [fetchNumeroDeRecordatorios, convertirComprasATabla]);

  /**
   * Función para refrescar datos manualmente
   */
  const refetch = useCallback(async () => {
    apiLogger.debug('🔄 Refrescando datos...');
    isFetchingRef.current = false; // Resetear para permitir refresco
    await fetchDatos();
  }, [fetchDatos]);

  // Efecto principal: cargar datos al montar (solo una vez)
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      apiLogger.debug('🚀 Inicializando useSupabaseDashboard...');
      hasInitialized.current = true;
      fetchDatos();
    }
  }, []); // Empty dependency array - solo ejecutar al montar

  return {
    compras,
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
 * Hook simplificado que retorna solo las compras
 */
export function useComprasFromSupabase(tabs: TabConfig[]): {
  compras: Compra[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { compras, loading, error, refetch } = useSupabaseDashboard(tabs);
  return { compras, loading, error, refetch };
}
