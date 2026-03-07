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

    // Obtener compras directamente para tener control total sobre los datos
    const { data, error } = await supabase
      .from('compras')
      .select('tienda, total, fecha, precio_unitario, cantidad')
      .order('fecha', { ascending: false });

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

    apiLogger.info('📊 Datos crudos de compras:', {
      count: data?.length,
      muestra: data?.slice(0, 3)
    });

    (data || []).forEach((compra: any) => {
      const tiendaNormalizada = normalizarTienda(compra.tienda);

      // Valores de la tabla compras
      const totalCompra = Number(compra.total) || 0;
      const precioUnitario = Number(compra.precio_unitario) || 0;
      const fechaCompra = compra.fecha;

      if (mapaTiendas.has(tiendaNormalizada)) {
        // Ya existe, acumular valores
        const existente = mapaTiendas.get(tiendaNormalizada);
        existente.gasto_total += totalCompra;
        existente.total_compras += 1; // Contar compras

        // Acumular precios unitarios para promedio
        existente.suma_precios_unitarios = (existente.suma_precios_unitarios || 0) + precioUnitario;
        existente.contador_precios = (existente.contador_precios || 0) + 1;

        // Mantener la fecha más reciente
        if (fechaCompra) {
          const fechaExistente = new Date(existente.ultima_compra || 0);
          const fechaNueva = new Date(fechaCompra);
          if (fechaNueva > fechaExistente) {
            existente.ultima_compra = fechaCompra;
          }
        }
      } else {
        // Nueva tienda, agregar al mapa
        mapaTiendas.set(tiendaNormalizada, {
          tienda_original: compra.tienda,
          tienda_normalizada: tiendaNormalizada,
          gasto_total: totalCompra,
          total_compras: 1,
          suma_precios_unitarios: precioUnitario,
          contador_precios: 1,
          ultima_compra: fechaCompra,
        });
      }
    });

    // Convertir a array, ordenar por gasto_total y añadir ranking
    const gastoPorTienda = Array.from(mapaTiendas.values())
      .sort((a, b) => b.gasto_total - a.gasto_total)
      .slice(0, limit)
      .map((item) => {
        // Calcular precio promedio real: suma de precios unitarios / número de compras
        const precioPromedioCalculado = item.suma_precios_unitarios / item.contador_precios;

        apiLogger.info('🏪 Tienda procesada:', {
          tienda: item.tienda_normalizada,
          gasto_total: item.gasto_total,
          suma_precios_unitarios: item.suma_precios_unitarios,
          contador_precios: item.contador_precios,
          precio_promedio_resultado: precioPromedioCalculado,
          ultima_compra: item.ultima_compra,
        });

        return {
          ranking: 0, // Se asigna después
          tienda: item.tienda_normalizada,
          tienda_original: item.tienda_original, // Para debug
          gasto_total: item.gasto_total,
          total_compras: item.total_compras,
          precio_promedio: precioPromedioCalculado,
          ultima_compra: item.ultima_compra,
        };
      })
      .map((item, idx) => ({ ...item, ranking: idx + 1 }));

    apiLogger.info('✅ Gasto por tienda obtenido y normalizado:', {
      total_compras: data?.length || 0,
      total_antes_normalizar: gastoPorTienda.length,
      tiendas_unicas: gastoPorTienda.length,
      limit,
      muestra_tiendas: gastoPorTienda.map(t => ({
        tienda: t.tienda,
        gasto_total: t.gasto_total,
        precio_promedio: t.precio_promedio,
        ultima_compra: t.ultima_compra,
      }))
    });

    return NextResponse.json({
      success: true,
      data: gastoPorTienda,
      metadata: {
        total_compras_procesadas: data?.length || 0,
        tiendas_unicas: gastoPorTienda.length,
        limit,
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
      _table: 'compras',
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
