import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';
import { normalizarTienda } from '@/lib/data-utils';

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

    // Obtener todos los datos sin límite primero para poder agrupar y normalizar
    const { data, error } = await supabase
      .from('vista_gasto_por_tienda')
      .select('*')
      .order('gasto_total', { ascending: false });

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

    // Agrupar por tienda normalizada para evitar duplicados
    const mapaTiendas = new Map<string, any>();

    (data || []).forEach((item: any) => {
      const tiendaNormalizada = normalizarTienda(item.tienda);

      if (mapaTiendas.has(tiendaNormalizada)) {
        // Ya existe, acumular valores
        const existente = mapaTiendas.get(tiendaNormalizada);
        existente.gasto_total += item.gasto_total;
        existente.total_compras += item.total_compras;

        // Actualizar precio promedio ponderado
        const totalGasto = existente.gasto_total;
        const totalCompras = existente.total_compras;
        existente.precio_promedio = totalGasto / totalCompras;

        // Mantener la fecha más reciente
        const fechaExistente = new Date(existente.ultima_compra);
        const fechaNueva = new Date(item.ultima_compra);
        if (fechaNueva > fechaExistente) {
          existente.ultima_compra = item.ultima_compra;
        }
      } else {
        // Nueva tienda, agregar al mapa
        mapaTiendas.set(tiendaNormalizada, {
          tienda_original: item.tienda,
          tienda_normalizada: tiendaNormalizada,
          gasto_total: item.gasto_total,
          total_compras: item.total_compras,
          precio_promedio: item.precio_promedio,
          ultima_compra: item.ultima_compra,
        });
      }
    });

    // Convertir a array, ordenar por gasto_total y añadir ranking
    const gastoPorTienda = Array.from(mapaTiendas.values())
      .sort((a, b) => b.gasto_total - a.gasto_total)
      .slice(0, limit)
      .map((item, idx) => ({
        ranking: idx + 1,
        tienda: item.tienda_normalizada,
        tienda_original: item.tienda_original, // Para debug
        gasto_total: item.gasto_total,
        total_compras: item.total_compras,
        precio_promedio: item.precio_promedio,
        ultima_compra: item.ultima_compra,
      }));

    apiLogger.info('✅ Gasto por tienda obtenido y normalizado:', {
      total_antes: data?.length || 0,
      total_despues: gastoPorTienda.length,
      tiendas_unicas: gastoPorTienda.length,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: gastoPorTienda,
      metadata: {
        total_antes_normalizar: data?.length || 0,
        total_despues_normalizar: gastoPorTienda.length,
        limit,
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
      _view: 'vista_gasto_por_tienda',
      _normalized: true,
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
