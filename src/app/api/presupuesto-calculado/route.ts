import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Calcula el presupuesto mensual basado en el promedio histórico
 * Query params:
 * - mes: número de mes (1-12), default: mes actual
 * - anio: año, default: año actual
 * - meses_a_considerar: cantidad de meses a promediar (default: 3)
 *
 * Estrategia:
 * 1. Primero busca si hay un presupuesto explícito en la tabla presupuestos
 * 2. Si no existe, calcula el promedio de gastos de los últimos N meses
 * 3. Aplica un margen de seguridad del 10% sobre el promedio calculado
 */
export async function GET(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/presupuesto-calculado');

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));
    const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()));
    const mesesAConsiderar = parseInt(searchParams.get('meses_a_considerar') || '3');

    apiLogger.info('Calculando presupuesto:', { mes, anio, mesesAConsiderar });

    // ============================================================================
    // 1. Primero verificar si hay un presupuesto explícito guardado
    // ============================================================================
    const { data: presupuestoGuardado, error: errorPresupuesto } = await supabase
      .from('presupuestos')
      .select('monto')
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    if (!errorPresupuesto && presupuestoGuardado && presupuestoGuardado.monto > 0) {
      apiLogger.info('✅ Presupuesto explícito encontrado:', { monto: presupuestoGuardado.monto });
      return NextResponse.json({
        success: true,
        data: {
          monto: presupuestoGuardado.monto,
          mes,
          anio,
          fuente: 'explicito',
          descripcion: 'Presupuesto configurado manualmente',
        },
      });
    }

    // ============================================================================
    // 2. Si no hay presupuesto explícito, calcular promedio de meses anteriores
    // ============================================================================
    apiLogger.info('No hay presupuesto explícito, calculando promedio...');

    // Obtener fecha de inicio: N meses atrás desde el primer día del mes actual
    const fechaInicioMes = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59); // Último día del mes anterior
    const fechaInicio = new Date(anio, mes - 1 - mesesAConsiderar, 1);

    apiLogger.info('Rango de fechas para promedio:', {
      inicio: fechaInicio.toISOString(),
      fin: fechaFin.toISOString(),
      meses: mesesAConsiderar,
    });

    // Obtener todas las compras de los últimos N meses
    const { data: compras, error: errorCompras } = await supabase
      .from('compras')
      .select('fecha, total')
      .gte('fecha', fechaInicio.toISOString())
      .lte('fecha', fechaFin.toISOString())
      .order('fecha', { ascending: true });

    if (errorCompras) {
      apiLogger.error('Error obteniendo compras para promedio:', errorCompras);
      throw errorCompras;
    }

    if (!compras || compras.length === 0) {
      apiLogger.warn('No hay compras históricas para calcular promedio');
      return NextResponse.json({
        success: true,
        data: {
          monto: 3000, // Fallback al valor original hardcoded
          mes,
          anio,
          fuente: 'fallback',
          descripcion: 'No hay datos históricos suficientes',
        },
      });
    }

    // Agrupar gastos por mes
    const gastosPorMes: Map<string, number> = new Map();

    compras.forEach((compra) => {
      const fecha = new Date(compra.fecha);
      const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const gastoActual = gastosPorMes.get(claveMes) || 0;
      gastosPorMes.set(claveMes, gastoActual + compra.total);
    });

    // Convertir a array y ordenar
    const mesesConGasto = Array.from(gastosPorMes.entries()).map(([mesKey, total]) => ({
      mes: mesKey,
      total,
    })).sort((a, b) => a.mes.localeCompare(b.mes));

    apiLogger.info('Gastos por mes:', mesesConGasto);

    // Calcular promedio
    const sumaTotal = mesesConGasto.reduce((sum, mes) => sum + mes.total, 0);
    const promedio = sumaTotal / mesesConGasto.length;

    // Aplicar margen de seguridad del 10%
    const margenSeguridad = 1.10;
    const presupuestoCalculado = Math.round(promedio * margenSeguridad);

    apiLogger.info('✅ Presupuesto calculado:', {
      sumaTotal,
      mesesConsiderados: mesesConGasto.length,
      promedio,
      presupuestoCalculado,
    });

    return NextResponse.json({
      success: true,
      data: {
        monto: presupuestoCalculado,
        mes,
        anio,
        fuente: 'calculado',
        descripcion: `Basado en promedio de ${mesesConGasto.length} meses con margen 10%`,
        metadata: {
          promedio: Math.round(promedio),
          meses_considerados: mesesConGasto.length,
          meses_analizados: mesesConGasto,
          margen_seguridad: '10%',
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/presupuesto-calculado:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al calcular presupuesto',
      },
      { status: 500 }
    );
  }
}
