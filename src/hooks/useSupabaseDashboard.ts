import { useState, useEffect, useCallback, useMemo } from 'react';
import { Compra, KPIData } from '@/types';
import { normalizarFecha } from '@/lib/data-utils';
import { apiLogger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

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

  /**
   * Obtiene el número de recordatorios
   */
  const fetchNumeroDeRecordatorios = useCallback(async (): Promise<number> => {
    try {
      const response = await fetch('/api/recordatorios?incluirAutomaticos=true');
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
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      // Verificar que Supabase está configurado
      if (!supabase) {
        const errorMsg = 'Supabase no está configurado. Verifica las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel.';
        console.error('❌', errorMsg);
        console.error('Variables configuradas:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        });
        throw new Error(errorMsg);
      }

      apiLogger.debug('📊 Iniciando fetch desde Supabase...');
      console.log('✅ Supabase cliente creado correctamente');

      // Fetch paralelo: compras (directo a Supabase) + recordatorios
      const [comprasResult, recordatoriosCount] = await Promise.all([
        // Llamada directa a Supabase - sin API route intermedia
        supabase
          .from('compras')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(1000),
        fetchNumeroDeRecordatorios(),
      ]);

      // Verificar error de compras
      if (comprasResult.error) {
        throw new Error(comprasResult.error.message);
      }

      // Procesar compras desde Supabase a formato Compra
      const comprasProcesadas: Compra[] = (comprasResult.data || []).map((item: any, index: number) => ({
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

      const kpis: KPIData = {
        gastoQuincenal,
        facturasProcesadas: facturasUnicas.size,
        numeroDeRecordatorios: recordatoriosCount,
      };

      // Actualizar estado
      setCompras(comprasProcesadas);
      setSheetsData(allData);
      setKpiData(kpis);
      setIsUsingMock(false);
      setDataSource('supabase');

      apiLogger.info('✅ Datos cargados desde Supabase:', {
        compras: comprasProcesadas.length,
        gastoQuincenal,
        facturas: facturasUnicas.size,
        recordatorios: recordatoriosCount,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      apiLogger.error('❌ Error en useSupabaseDashboard:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tabs, fetchNumeroDeRecordatorios, convertirComprasATabla]);

  /**
   * Función para refrescar datos manualmente
   */
  const refetch = useCallback(async () => {
    apiLogger.debug('🔄 Refrescando datos...');
    await fetchDatos();
  }, [fetchDatos]);

  // Efecto principal: cargar datos al montar
  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

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
