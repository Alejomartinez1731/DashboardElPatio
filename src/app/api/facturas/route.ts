import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/facturas
 *
 * Obtiene facturas desde Supabase con sus compras relacionadas
 *
 * Query params:
 * - restaurante_id: UUID del restaurante (opcional)
 * - limit: número de resultados (default: 50, max: 500)
 * - offset: número de resultados a saltar (default: 0)
 *
 * Retorna facturas con sus líneas de compra relacionadas
 *
 * @example
 * // Obtener todas las facturas (paginado)
 * GET /api/facturas?limit=20&offset=0
 *
 * @example
 * // Filtrar por restaurante
 * GET /api/facturas?restaurante_id=xxx
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');

  apiLogger.debug('API /api/facturas llamada', {
    restauranteId,
    limit,
    offset
  });

  try {
    // Obtener facturas con sus compras usando join
    let query = supabase
      .from('facturas')
      .select(`
        *,
        compras (
          id,
          fecha,
          descripcion,
          cantidad,
          precio_unitario,
          total
        )
      `, { count: 'exact' })
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (restauranteId) {
      query = query.eq('restaurante_id', restauranteId);
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('Error en /api/facturas:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: 'Error consultando facturas en Supabase'
        },
        { status: 500 }
      );
    }

    apiLogger.info(`Facturas retornadas: ${data?.length || 0} de ${count || 0}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        offset,
        limit,
        has_more: (count || 0) > offset + limit
      },
      _source: 'supabase'
    });

  } catch (error) {
    apiLogger.error('Error inesperado en /api/facturas:', error);
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
