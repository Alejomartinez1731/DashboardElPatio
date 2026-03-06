import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Obtiene compras con paginación y filtros
 * Query params:
 * - limit: número de registros por página (default: 25)
 * - offset: número de registros a saltar (default: 0)
 * - tienda: filtrar por tienda (opcional)
 * - producto: buscar por producto (opcional, case insensitive)
 */
export async function GET(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/compras');

    // Obtener query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tienda = searchParams.get('tienda');
    const producto = searchParams.get('producto');

    apiLogger.info('Query params:', { limit, offset, tienda, producto });

    // Construir query base
    let query = supabase
      .from('compras')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (tienda && tienda !== 'todas') {
      query = query.ilike('tienda', `%${tienda}%`);
    }

    if (producto && producto.trim() !== '') {
      query = query.ilike('descripcion', `%${producto.trim()}%`);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('fecha', { ascending: false })
      .range(offset, offset + limit - 1);

    // Ejecutar query
    const { data, error, count } = await query;

    if (error) {
      apiLogger.error('Error obteniendo compras:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener compras',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const total = count || 0;

    apiLogger.info('✅ Compras obtenidas:', {
      count: data?.length || 0,
      total,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/compras:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener compras',
      },
      { status: 500 }
    );
  }
}
