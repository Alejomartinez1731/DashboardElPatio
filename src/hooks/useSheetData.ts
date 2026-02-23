import { useState, useEffect, useCallback } from 'react';
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
}

export interface UseSheetDataResult {
  compras: Compra[];
  comprasFiltradas: Compra[];
  sheetsData: Record<string, string[][]>;
  kpiData: KPIData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface TabConfig {
  id: string;
  sheetName: SheetName;
  dataKey: string;
}

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

  /**
   * Obtiene datos de la API y los procesa
   */
  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sheets');

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SheetsApiResponse = await response.json();

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

          // Procesar cada fila
          const comprasProcesadas: Compra[] = [];

          for (let i = 1; i < values.length; i++) {
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

          console.log(`✅ ${comprasProcesadas.length} compras procesadas`);

          // 3. Obtener datos adicionales para KPIs
          const historicoPreciosValues = (result.data.historico_precios?.values) || [];
          const registroDiarioValues = (result.data.registro_diario?.values) || [];

          // 4. Calcular KPIs
          const kpis = calcularKPIs(comprasProcesadas, historicoPreciosValues, registroDiarioValues);

          // 5. Actualizar estado
          setCompras(comprasProcesadas);
          setComprasFiltradas(comprasProcesadas);
          setSheetsData(allData);
          setKpiData(kpis);
        }
      } else {
        console.warn('⚠️ No hay datos en base_de_datos');
        setCompras([]);
        setComprasFiltradas([]);
        setSheetsData(allData);
        setKpiData({
          gastoQuincenal: 0,
          facturasProcesadas: 0,
          alertasDePrecio: 0,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Error en useSheetData:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tabs]);

  /**
   * Función para refrescar datos manualmente
   */
  const refetch = useCallback(async () => {
    console.log('🔄 Refrescando datos...');
    await fetchDatos();
  }, [fetchDatos]);

  // Efecto principal: cargar datos al montar
  useEffect(() => {
    fetchDatos();
  }, [fetchDatos]);

  return {
    compras,
    comprasFiltradas,
    sheetsData,
    kpiData,
    loading,
    error,
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
