import type { SheetData, SheetName } from '@/types';
import { generalLogger } from '@/lib/logger';

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

/**
 * Obtiene todos los datos del webhook de n8n
 * n8n se conecta a Google Sheets y devuelve los datos ya procesados
 */
export async function getN8NData(): Promise<Record<SheetName, SheetData>> {
  if (!N8N_WEBHOOK_URL) {
    generalLogger.error('❌ NEXT_PUBLIC_N8N_WEBHOOK_URL no está configurada');
    generalLogger.error('Variables de entorno disponibles:', Object.keys(process.env).filter(k => k.includes('N8N') || k.includes('PUBLIC')));
    throw new Error('NEXT_PUBLIC_N8N_WEBHOOK_URL no está configurada en variables de entorno. Por favor configura esta variable en tu plataforma de deployment.');
  }

  try {
    generalLogger.debug('📡 Llamando a webhook de n8n:', N8N_WEBHOOK_URL);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Nota: next.revalidate no se usa en API routes serverless
      // El cache se maneja a través de headers de respuesta
    });

    generalLogger.debug('Respuesta de n8n', { status: response.status, ok: response.ok });

    if (!response.ok) {
      throw new Error(`n8n webhook respondió con status ${response.status}`);
    }

    const text = await response.text();
    if (text.length > 0) {
      generalLogger.debug('Respuesta de n8n', { longitud: text.length });
    }

    let n8nResponse;
    try {
      n8nResponse = JSON.parse(text);
    } catch (parseError) {
      generalLogger.error('❌ Error parseando JSON de n8n:', parseError);
      throw new Error(`La respuesta de n8n no es JSON válido: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    // n8n devuelve: { success: true, data: { historico: [...], historico_precios: [...], ... } }
    if (!n8nResponse.success || !n8nResponse.data) {
      generalLogger.error('❌ Respuesta de n8n no tiene el formato esperado:', n8nResponse);
      throw new Error('Respuesta de n8n no tiene el formato esperado');
    }

    // Convertir datos de n8n al formato SheetData que espera el dashboard
    // n8n devuelve { historico: { values: [[...]] }, ... }
    const result: Record<SheetName, SheetData> = {
      base_datos: {
        range: 'Base de datos!A1:Z',
        values: (n8nResponse.data.base_de_datos?.values) || [],
      },
      historico: {
        range: 'Historico!A1:Z',
        values: (n8nResponse.data.historico?.values) || [],
      },
      historico_precios: {
        range: 'Historico de precios!A1:Z',
        values: (n8nResponse.data.historico_precios?.values) || [],
      },
      costosos: {
        range: 'Producto más costoso!A1:Z',
        values: (n8nResponse.data.producto_mas_costoso?.values) || [],
      },
      gasto_tienda: {
        range: 'Gasto Por Tienda!A1:Z',
        values: (n8nResponse.data.gasto_por_tienda?.values) || [],
      },
      precio_producto: {
        range: 'Precio x Producto!A1:Z',
        values: (n8nResponse.data.precio_por_producto?.values) || [],
      },
      registro_diario: {
        range: 'Registro Diario!A1:Z',
        values: (n8nResponse.data.registro_diario?.values) || [],
      },
    };

    generalLogger.debug('✅ Datos procesados:', Object.keys(result).map(key => `${key}: ${result[key as SheetName].values.length} filas`));

    return result;
  } catch (error) {
    generalLogger.error('Error fetching n8n webhook:', error);
    throw error;
  }
}

/**
 * Obtiene datos de una hoja específica desde n8n
 */
export async function getN8NSheetData(sheetName: SheetName): Promise<SheetData> {
  const allData = await getN8NData();
  return allData[sheetName];
}
