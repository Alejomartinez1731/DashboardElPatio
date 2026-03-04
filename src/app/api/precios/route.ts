import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/precios
 *
 * Obtiene análisis de precios desde Supabase
 *
 * Query params:
 * - restaurante_id: UUID del restaurante (opcional)
 *
 * Retorna tres conjuntos de datos:
 * 1. productos_costosos: Ranking de productos por gasto total
 * 2. evolucion_precios: Historial de cambios de precio
 * 3. categorias: Gasto por categoría de producto
 *
 * @example
 * // Obtener todos los análisis de precios
 * GET /api/precios
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');

  apiLogger.debug('API /api/precios llamada', { restauranteId });

  try {
    // Ejecutar todas las queries en paralelo para mejor performance
    const [
      costososResult,
      evolucionResult,
      categoriasResult
    ] = await Promise.all([
      // Productos más costosos (vista pre-calculada)
      supabase
        .from('vista_productos_costosos')
        .select('*')
        .order('gasto_total', { ascending: false })
        .limit(20),

      // Evolución de precios
      supabase
        .from('vista_evolucion_precios')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(100),

      // Gasto por categoría
      supabase
        .from('vista_gasto_por_categoria')
        .select('*')
        .order('gasto_total', { ascending: false })
    ]);

    // Verificar errores
    const errors = [
      costososResult.error,
      evolucionResult.error,
      categoriasResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      apiLogger.error('Errores en /api/precios:', errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Error obteniendo datos de precios',
          details: errors.map(e => e?.message)
        },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      data: {
        productos_costosos: costososResult.data || [],
        evolucion_precios: evolucionResult.data || [],
        gasto_por_categoria: categoriasResult.data || []
      },
      counts: {
        productos_costosos: costososResult.data?.length || 0,
        evolucion_precios: evolucionResult.data?.length || 0,
        categorias: categoriasResult.data?.length || 0
      },
      _source: 'supabase'
    };

    apiLogger.info('Precios retornados:', response.counts);

    return NextResponse.json(response);

  } catch (error) {
    apiLogger.error('Error inesperado en /api/precios:', error);
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
