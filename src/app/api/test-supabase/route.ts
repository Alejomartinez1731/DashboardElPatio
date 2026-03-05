import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/test-supabase
 *
 * Endpoint de diagnóstico para verificar la conexión a Supabase
 *
 * Tests:
 * 1. Conexión básica (SELECT 1)
 * 2. Contar compras en la BD
 * 3. Obtener 5 compras de ejemplo
 * 4. Verificar vistas
 *
 * @example
 * GET /api/test-supabase
 */
export async function GET(request: Request) {
  const results: any = {
    success: true,
    tests: [] as any[],
    timestamp: new Date().toISOString()
  };

  try {
    // Test 1: Conexión básica - Test simple SELECT 1
    apiLogger.info('Test 1: Conexión básica');
    try {
      const { error } = await supabase.from('compras').select('id').limit(1);
      results.tests.push({
        name: 'Conexión básica',
        status: error ? 'error' : 'ok',
        result: error ? null : 'conectado',
        error: error?.message
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Conexión básica',
        status: 'error',
        result: null,
        error: e.message
      });
    }

    // Test 2: Contar compras
    apiLogger.info('Test 2: Contar compras');
    try {
      const { count, error } = await supabase
        .from('compras')
        .select('*', { count: 'exact', head: true });

      results.tests.push({
        name: 'Contar compras',
        status: error ? 'error' : 'ok',
        result: count,
        error: error?.message
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Contar compras',
        status: 'error',
        result: null,
        error: e.message
      });
    }

    // Test 3: Obtener 5 compras
    apiLogger.info('Test 3: Obtener 5 compras');
    try {
      const { data, error } = await supabase
        .from('compras')
        .select('*')
        .limit(5);

      results.tests.push({
        name: 'Obtener 5 compras',
        status: error ? 'error' : 'ok',
        result: data?.length || 0,
        error: error?.message,
        sample: data?.[0] || null
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Obtener 5 compras',
        status: 'error',
        result: null,
        error: e.message
      });
    }

    // Test 4: Verificar vista_gasto_por_tienda
    apiLogger.info('Test 4: Vista gasto_por_tienda');
    try {
      const { data, error } = await supabase
        .from('vista_gasto_por_tienda')
        .select('*')
        .limit(3);

      results.tests.push({
        name: 'Vista gasto_por_tienda',
        status: error ? 'error' : 'ok',
        result: data?.length || 0,
        error: error?.message,
        sample: data?.[0] || null
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Vista gasto_por_tienda',
        status: 'error',
        result: null,
        error: e.message
      });
    }

    // Test 5: Verificar vista_resumen_mensual
    apiLogger.info('Test 5: Vista resumen_mensual');
    try {
      const { data, error } = await supabase
        .from('vista_resumen_mensual')
        .select('*')
        .limit(3);

      results.tests.push({
        name: 'Vista resumen_mensual',
        status: error ? 'error' : 'ok',
        result: data?.length || 0,
        error: error?.message,
        sample: data?.[0] || null
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Vista resumen_mensual',
        status: 'error',
        result: null,
        error: e.message
      });
    }

    // Test 6: Verificar restaurantes
    apiLogger.info('Test 6: Restaurantes');
    try {
      const { data, error } = await supabase
        .from('restaurantes')
        .select('*');

      results.tests.push({
        name: 'Restaurantes',
        status: error ? 'error' : 'ok',
        result: data?.length || 0,
        error: error?.message,
        sample: data?.[0] || null
      });
    } catch (e: any) {
      results.tests.push({
        name: 'Restaurantes',
        status: 'error',
        result: null,
        error: e.message
      });
    }

    // Calcular resumen
    const errors = results.tests.filter((t: any) => t.status === 'error');
    const oks = results.tests.filter((t: any) => t.status === 'ok');

    results.summary = {
      total: results.tests.length,
      ok: oks.length,
      error: errors.length,
      status: errors.length === 0 ? 'pass' : 'partial'
    };

    apiLogger.info('Test Supabase completado:', results.summary);

    return NextResponse.json(results);

  } catch (error) {
    apiLogger.error('Error en test Supabase:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        results
      },
      { status: 500 }
    );
  }
}
