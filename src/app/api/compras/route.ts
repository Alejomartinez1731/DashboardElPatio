import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/compras
 *
 * Obtiene compras desde Supabase con filtros y paginación
 *
 * Query params:
 * - restaurante_id: UUID del restaurante (opcional)
 * - proveedor_id: UUID del proveedor (opcional)
 * - tienda: filtro por nombre de tienda (partial match, opcional)
 * - producto: filtro por nombre de producto (partial match, opcional)
 * - fecha_desde: fecha inicio (formato YYYY-MM-DD, opcional)
 * - fecha_hasta: fecha fin (formato YYYY-MM-DD, opcional)
 * - limit: número de resultados (default: 100, max: 1000)
 * - offset: número de resultados a saltar (default: 0)
 *
 * @example
 * // Obtener todas las compras (paginado)
 * GET /api/compras?limit=25&offset=0
 *
 * @example
 * // Filtrar por tienda
 * GET /api/compras?tienda=mercadona
 *
 * @example
 * // Filtrar por rango de fechas
 * GET /api/compras?fecha_desde=2026-01-01&fecha_hasta=2026-01-31
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parámetros de query
  const restauranteId = searchParams.get('restaurante_id');
  const proveedorId = searchParams.get('proveedor_id');
  const tienda = searchParams.get('tienda');
  const producto = searchParams.get('producto');
  const fechaDesde = searchParams.get('fecha_desde');
  const fechaHasta = searchParams.get('fecha_hasta');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
  const offset = parseInt(searchParams.get('offset') || '0');

  apiLogger.debug('API /api/compras llamada', {
    restauranteId,
    proveedorId,
    tienda,
    producto,
    fechaDesde,
    fechaHasta,
    limit,
    offset
  });

  try {
    let query = supabase
      .from('compras')
      .select('*', { count: 'exact' })
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (restauranteId) {
      query = query.eq('restaurante_id', restauranteId);
    }
    if (proveedorId) {
      query = query.eq('proveedor_id', proveedorId);
    }
    if (tienda) {
      query = query.ilike('tienda', `%${tienda}%`);
    }
    if (producto) {
      query = query.ilike('descripcion', `%${producto}%`);
    }
    if (fechaDesde) {
      query = query.gte('fecha', fechaDesde);
    }
    if (fechaHasta) {
      query = query.lte('fecha', fechaHasta);
    }

    // Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('Error en /api/compras:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: 'Error consultando compras en Supabase'
        },
        { status: 500 }
      );
    }

    apiLogger.info(`Compras retornadas: ${data?.length || 0} de ${count || 0}`);

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
    apiLogger.error('Error inesperado en /api/compras:', error);
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
