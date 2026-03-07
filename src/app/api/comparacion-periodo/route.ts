import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';

export interface ComparacionPeriodo {
  periodo: string;
  gasto_total: number;
  total_compras: number;
  total_facturas: number;
}

export interface ComparacionResponse {
  success: boolean;
  data?: {
    periodo_actual: ComparacionPeriodo;
    periodo_anterior: ComparacionPeriodo;
    variacion: {
      gasto: {
        valor: number;
        porcentaje: number;
      };
      compras: {
        valor: number;
        porcentaje: number;
      };
    };
  };
  error?: string;
}

/**
 * GET /api/comparacion-periodo
 * Compara el mes actual con el mes anterior
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = requireSupabase();
    const { searchParams } = new URL(request.url);

    const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()));
    const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1));

    // Obtener datos del mes actual
    const inicioMesActual = `${anio}-${mes.toString().padStart(2, '0')}-01`;
    const finMesActual = mes === 12
      ? `${anio + 1}-01-01`
      : `${anio}-${(mes + 1).toString().padStart(2, '0')}-01`;

    const { data: mesActualData, error: errorActual } = await supabase
      .from('compras')
      .select('total')
      .gte('fecha', inicioMesActual)
      .lt('fecha', finMesActual);

    if (errorActual) {
      throw new Error(`Error obteniendo mes actual: ${errorActual.message}`);
    }

    // Obtener datos del mes anterior
    let mesAnterior = mes - 1;
    let anioAnterior = anio;
    if (mesAnterior === 0) {
      mesAnterior = 12;
      anioAnterior = anio - 1;
    }

    const inicioMesAnterior = `${anioAnterior}-${mesAnterior.toString().padStart(2, '0')}-01`;
    const finMesAnterior = mesAnterior === 12
      ? `${anioAnterior + 1}-01-01`
      : `${anioAnterior}-${(mesAnterior + 1).toString().padStart(2, '0')}-01`;

    const { data: mesAnteriorData, error: errorAnterior } = await supabase
      .from('compras')
      .select('total')
      .gte('fecha', inicioMesAnterior)
      .lt('fecha', finMesAnterior);

    if (errorAnterior) {
      throw new Error(`Error obteniendo mes anterior: ${errorAnterior.message}`);
    }

    // Calcular totales
    const gastoActual = mesActualData?.reduce((sum, c) => sum + (c.total || 0), 0) || 0;
    const comprasActual = mesActualData?.length || 0;

    const gastoAnterior = mesAnteriorData?.reduce((sum, c) => sum + (c.total || 0), 0) || 0;
    const comprasAnterior = mesAnteriorData?.length || 0;

    // Calcular variación
    const variacionGasto = gastoAnterior > 0
      ? ((gastoActual - gastoAnterior) / gastoAnterior) * 100
      : 0;

    const variacionCompras = comprasAnterior > 0
      ? ((comprasActual - comprasAnterior) / comprasAnterior) * 100
      : 0;

    // Nombres de periodos
    const nombreMesActual = new Date(anio, mes - 1).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });

    const nombreMesAnterior = new Date(anioAnterior, mesAnterior - 1).toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });

    const periodoActual: ComparacionPeriodo = {
      periodo: nombreMesActual,
      gasto_total: Math.round(gastoActual * 100) / 100,
      total_compras: comprasActual,
      total_facturas: 0, // No tenemos tabla de facturas activa
    };

    const periodoAnterior: ComparacionPeriodo = {
      periodo: nombreMesAnterior,
      gasto_total: Math.round(gastoAnterior * 100) / 100,
      total_compras: comprasAnterior,
      total_facturas: 0,
    };

    return NextResponse.json<ComparacionResponse>({
      success: true,
      data: {
        periodo_actual: periodoActual,
        periodo_anterior: periodoAnterior,
        variacion: {
          gasto: {
            valor: Math.round((gastoActual - gastoAnterior) * 100) / 100,
            porcentaje: Math.round(variacionGasto * 10) / 10,
          },
          compras: {
            valor: comprasActual - comprasAnterior,
            porcentaje: Math.round(variacionCompras * 10) / 10,
          },
        },
      },
    });

  } catch (error) {
    console.error('Error en /api/comparacion-periodo:', error);
    return NextResponse.json<ComparacionResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}
