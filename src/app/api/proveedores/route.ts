import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface InfoTienda {
  tienda: string;
  restaurante_id: string | null;
  total_compras: number;
  productos_unicos: number;
  gasto_total: number;
  precio_promedio: number;
  primera_compra: string;
  ultima_compra: string;
}

/**
 * GET - Obtiene información de proveedores/tiendas
 */
export async function GET(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/proveedores');

    // Intentar obtener desde vista primero
    const { data: vistaData, error: vistaError } = await supabase
      .from('vista_gasto_por_tienda')
      .select('*')
      .order('gasto_total', { ascending: false });

    if (!vistaError && vistaData && vistaData.length > 0) {
      apiLogger.info('✅ Datos obtenidos desde vista:', { count: vistaData.length });
      return NextResponse.json({
        success: true,
        data: vistaData,
        _source: 'vista',
      });
    }

    // Si la vista falla o no tiene datos, calcular desde la tabla compras
    apiLogger.warn('Vista no disponible o vacía, calculando desde tabla compras...');

    const { data: compras, error: comprasError } = await supabase
      .from('compras')
      .select('tienda, fecha, total, descripcion, precio_unitario, restaurante_id')
      .order('fecha', { ascending: false });

    if (comprasError) {
      throw new Error(comprasError.message);
    }

    if (!compras || compras.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        _source: 'table',
      });
    }

    // Agrupar por tienda
    const tiendasMap = new Map<string, InfoTienda>();

    compras.forEach(compra => {
      const tienda = compra.tienda || 'Sin tienda';

      if (!tiendasMap.has(tienda)) {
        tiendasMap.set(tienda, {
          tienda,
          restaurante_id: compra.restaurante_id,
          total_compras: 0,
          productos_unicos: new Set<string>().size,
          gasto_total: 0,
          precio_promedio: 0,
          primera_compra: compra.fecha,
          ultima_compra: compra.fecha,
        });
      }

      const info = tiendasMap.get(tienda)!;
      info.total_compras++;
      info.gasto_total += compra.total || 0;
      info.ultima_compra = compra.fecha;
    });

    // Convertir a array y calcular productos únicos y precio promedio
    const productosUnicosPorTienda = new Map<string, Set<string>>();

    compras.forEach(compra => {
      const tienda = compra.tienda || 'Sin tienda';
      if (!productosUnicosPorTienda.has(tienda)) {
        productosUnicosPorTienda.set(tienda, new Set());
      }
      productosUnicosPorTienda.get(tienda)!.add(compra.descripcion);
    });

    const resultado = Array.from(tiendasMap.values()).map(tienda => ({
      ...tienda,
      productos_unicos: productosUnicosPorTienda.get(tienda.tienda)?.size || 0,
      precio_promedio: tienda.total_compras > 0 ? tienda.gasto_total / tienda.total_compras : 0,
    }));

    // Ordenar por gasto total
    resultado.sort((a, b) => b.gasto_total - a.gasto_total);

    apiLogger.info('✅ Datos calculados desde tabla:', { count: resultado.length });

    return NextResponse.json({
      success: true,
      data: resultado,
      _source: 'table',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/proveedores:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener proveedores',
      },
      { status: 500 }
    );
  }
}
