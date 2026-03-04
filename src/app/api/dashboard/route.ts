import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/dashboard
 *
 * Obtiene datos resumidos para el dashboard principal
 *
 * Query params:
 * - restaurante_id: UUID del restaurante (opcional)
 * - anio: año a consultar (default: año actual)
 * - mes: mes a consultar (default: mes actual)
 *
 * Retorna:
 * - resumen: KPIs del mes (vista_resumen_mensual)
 * - gasto_tiendas: Gasto por tienda del mes
 * - comparacion: Comparación entre periodo actual y anterior
 *
 * @example
 * // Obtener dashboard del mes actual
 * GET /api/dashboard
 *
 * @example
 * // Obtener dashboard de un mes específico
 * GET /api/dashboard?anio=2026&mes=3
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restauranteId = searchParams.get('restaurante_id');
  const anio = parseInt(searchParams.get('anio') || new Date().getFullYear().toString());
  const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());

  apiLogger.debug('API /api/dashboard llamada', { restauranteId, anio, mes });

  try {
    // Ejecutar queries en paralelo
    const [resumenResult, gastoTiendasResult, comparacionResult] = await Promise.all([
      // 1. Resumen del mes
      supabase
        .from('vista_resumen_mensual')
        .select('*')
        .eq('anio', anio)
        .eq('mes', mes)
        .maybeSingle(), // maybeSingle retorna null si no hay resultados

      // 2. Gasto por tienda del mes
      supabase
        .from('vista_gasto_tienda_mensual')
        .select('*')
        .eq('anio', anio)
        .eq('mes', mes)
        .order('gasto_total', { ascending: false }),

      // 3. Comparación de periodos (últimos 30 días vs anteriores)
      supabase.rpc('comparar_periodos', {
        p_restaurante_id: restauranteId,
        p_dias: 30
      })
    ]);

    // Verificar errores (resumen puede ser null, no es error)
    if (resumenResult.error && resumenResult.error.code !== 'PGRST116') {
      apiLogger.error('Error en resumen:', resumenResult.error);
    }

    if (gastoTiendasResult.error) {
      apiLogger.error('Error en gasto_tiendas:', gastoTiendasResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error obteniendo gasto por tiendas',
          details: gastoTiendasResult.error.message
        },
        { status: 500 }
      );
    }

    if (comparacionResult.error) {
      apiLogger.error('Error en comparación:', comparacionResult.error);
      // No fallamos si no hay comparación, puede no haber datos suficientes
    }

    const response = {
      success: true,
      data: {
        resumen: resumenResult.data || null,
        gasto_tiendas: gastoTiendasResult.data || [],
        comparacion: comparacionResult.data || []
      },
      params: {
        restaurante_id: restauranteId,
        anio,
        mes
      },
      _source: 'supabase'
    };

    apiLogger.info('Dashboard data retornada:', {
      resumen: response.data.resumen ? 'OK' : 'NULL',
      gasto_tiendas: response.data.gasto_tiendas.length,
      comparacion: response.data.comparacion.length
    });

    return NextResponse.json(response);

  } catch (error) {
    apiLogger.error('Error inesperado en /api/dashboard:', error);
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
