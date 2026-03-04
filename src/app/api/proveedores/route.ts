import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/proveedores
 *
 * Obtiene análisis de proveedores desde la vista vista_gasto_por_tienda
 *
 * Query params:
 * - restaurante_id: UUID del restaurante (opcional)
 *
 * La vista ya incluye:
 * - tienda: nombre del proveedor
 * - total_compras: número de líneas de compra
 * - productos_unicos: cantidad de productos diferentes
 * - gasto_total: suma total gastada
 * - precio_promedio: precio unitario promedio
 * - primera_compra: fecha de primera compra
 * - ultima_compra: fecha de última compra
 *
 * @example
 * // Obtener todos los proveedores
 * GET /api/proveedores
 *
 * @example
 * // Filtrar por restaurante
 * GET /api/proveedores?restaurante_id=xxx
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');

  apiLogger.debug('API /api/proveedores llamada', { restauranteId });

  try {
    // Usar la vista que ya tiene todos los cálculos pre-hechos
    let query = supabase
      .from('vista_gasto_por_tienda')
      .select('*')
      .order('gasto_total', { ascending: false });

    if (restauranteId) {
      query = query.eq('restaurante_id', restauranteId);
    }

    const { data, error } = await query;

    if (error) {
      apiLogger.error('Error en /api/proveedores:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: 'Error consultando vista_gasto_por_tienda'
        },
        { status: 500 }
      );
    }

    apiLogger.info(`Proveedores retornados: ${data?.length || 0}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      _source: 'supabase'
    });

  } catch (error) {
    apiLogger.error('Error inesperado en /api/proveedores:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
