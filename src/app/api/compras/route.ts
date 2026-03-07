import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';
import { normalizarTienda } from '@/lib/data-utils';

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

    // NOTA: El filtro de tienda se aplica EN EL SERVIDOR después de obtener datos
    // porque necesitamos normalizar las tiendas antes de comparar
    // Solo aplicamos producto en Supabase
    if (producto && producto.trim() !== '') {
      query = query.ilike('descripcion', `%${producto.trim()}%`);
    }

    // Si hay filtro de tienda, necesitamos obtener TODOS los datos primero (sin paginar)
    // para poder filtrar por tienda normalizada en el servidor
    const necesitaFiltroTienda = tienda && tienda !== 'todas';

    if (!necesitaFiltroTienda) {
      // Sin filtro de tienda: paginar en Supabase (más eficiente)
      query = query
        .order('fecha', { ascending: false })
        .range(offset, offset + limit - 1);

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
    } else {
      // CON filtro de tienda: obtener todos los datos sin paginar, filtrar en servidor
      apiLogger.info('⚠️ Filtrando por tienda en servidor (menos eficiente)', { tienda });

      query = query
        .order('fecha', { ascending: false }); // Sin range - obtener todos

      // Si hay filtro de producto, aplicarlo también
      if (producto && producto.trim() !== '') {
        query = query.ilike('descripcion', `%${producto.trim()}%`);
      }

      const { data: allData, error } = await query;

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

      // Filtrar por tienda normalizada en el servidor
      const filteredData = (allData || []).filter((compra: any) => {
        const tiendaNormalizada = normalizarTienda(compra.tienda);
        return tiendaNormalizada === tienda;
      });

      const total = filteredData.length;

      // Aplicar paginación en el servidor
      const paginatedData = filteredData.slice(offset, offset + limit);

      apiLogger.info('✅ Compras filtradas por tienda:', {
        filtroTienda: tienda,
        totalAntes: allData?.length || 0,
        totalDespues: total,
        devueltos: paginatedData.length,
      });

      return NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        timestamp: new Date().toISOString(),
        _source: 'supabase',
        _filteredBy: 'tienda',
        _filterValue: tienda,
      });
    }
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
