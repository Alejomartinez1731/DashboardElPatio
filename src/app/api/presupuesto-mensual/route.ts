import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Obtiene el presupuesto mensual
 * Query params:
 * - mes: número de mes (1-12), default: mes actual
 * - anio: año, default: año actual
 */
export async function GET(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/presupuesto-mensual');

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));
    const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()));

    apiLogger.info('Obteniendo presupuesto:', { mes, anio });

    const { data, error } = await supabase
      .from('presupuestos')
      .select('monto')
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    if (error) {
      apiLogger.error('Error obteniendo presupuesto:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener presupuesto',
          details: error.message,
        },
        { status: 500 }
      );
    }

    apiLogger.info('✅ Presupuesto obtenido:', { monto: data?.monto || 0 });

    return NextResponse.json({
      success: true,
      data: {
        monto: data?.monto || 0,
        mes,
        anio,
      },
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/presupuesto-mensual:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener presupuesto',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Guarda o actualiza el presupuesto mensual
 * Body: { mes, anio, monto }
 */
export async function POST(request: NextRequest) {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 POST /api/presupuesto-mensual');

    const body = await request.json();
    const { mes, anio, monto } = body;

    apiLogger.info('Guardando presupuesto:', { mes, anio, monto });

    if (!mes || !anio || monto === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan parámetros requeridos: mes, anio, monto',
        },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const { data: existente } = await supabase
      .from('presupuestos')
      .select('id')
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    let result;
    if (existente) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('presupuestos')
        .update({ monto })
        .eq('mes', mes)
        .eq('anio', anio)
        .select('monto, mes, anio')
        .single();

      if (error) throw error;
      result = data;
      apiLogger.info('Presupuesto actualizado:', result);
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('presupuestos')
        .insert({ mes, anio, monto })
        .select('monto, mes, anio')
        .single();

      if (error) throw error;
      result = data;
      apiLogger.info('Presupuesto creado:', result);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en POST /api/presupuesto-mensual:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al guardar presupuesto',
      },
      { status: 500 }
    );
  }
}
