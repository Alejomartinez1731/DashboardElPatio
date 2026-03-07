import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Obtiene los N productos más costosos de Supabase
 * Query params:
 * - limit: cantidad de productos a retornar (default: 10)
 */
export async function GET(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/productos-costosos');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    apiLogger.info('Obteniendo productos más costosos:', { limit });

    // Obtener productos ordenados por precio unitario (descendente)
    const { data, error } = await supabase
      .from('compras')
      .select('id, fecha, tienda, descripcion, cantidad, precio_unitario, total')
      .order('precio_unitario', { ascending: false })
      .limit(limit);

    if (error) {
      apiLogger.error('Error obteniendo productos costosos:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener productos costosos',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Agrupar por producto para evitar duplicados
    // Usamos el producto más costoso de cada tipo
    const productosUnicos = new Map<string, any>();

    (data || []).forEach((compra) => {
      const producto = compra.descripcion;
      if (!productosUnicos.has(producto)) {
        productosUnicos.set(producto, {
          id: compra.id,
          fecha: compra.fecha,
          tienda: compra.tienda,
          producto: producto,
          cantidad: compra.cantidad,
          precioUnitario: compra.precio_unitario,
          total: compra.total,
        });
      }
    });

    // Convertir a array y ordenar por precio unitario
    const productosCostosos = Array.from(productosUnicos.values())
      .sort((a, b) => b.precioUnitario - a.precioUnitario)
      .slice(0, limit);

    apiLogger.info('✅ Productos costosos obtenidos:', {
      total: productosCostosos.length,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: productosCostosos,
      metadata: {
        total: productosCostosos.length,
        limit,
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/productos-costosos:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener productos costosos',
      },
      { status: 500 }
    );
  }
}
