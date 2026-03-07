import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Obtiene el gasto acumulado por tienda desde Supabase
 * Query params:
 * - limit: cantidad de tiendas a retornar (default: todas)
 */
export async function GET(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/gasto-por-tienda');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    apiLogger.info('Obteniendo gasto por tienda:', { limit });

    // Usar la vista existente vista_gasto_por_tienda si existe, o calcular desde compras
    const { data, error } = await supabase
      .from('vista_gasto_por_tienda')
      .select('*')
      .order('gasto_total', { ascending: false })
      .limit(limit);

    if (error) {
      apiLogger.error('Error obteniendo gasto por tienda:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener gasto por tienda',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Transformar datos al formato esperado
    const gastoPorTienda = (data || []).map((item: any, idx: number) => ({
      ranking: idx + 1,
      tienda: item.tienda,
      gasto_total: item.gasto_total,
      total_compras: item.total_compras,
      precio_promedio: item.precio_promedio,
      ultima_compra: item.ultima_compra,
    }));

    apiLogger.info('✅ Gasto por tienda obtenido:', {
      total: gastoPorTienda.length,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: gastoPorTienda,
      metadata: {
        total: gastoPorTienda.length,
        limit,
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
      _view: 'vista_gasto_por_tienda',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/gasto-por-tienda:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener gasto por tienda',
      },
      { status: 500 }
    );
  }
}
