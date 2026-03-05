import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';
import { calcularKPIsAvanzados } from '@/lib/calculadoras-financieras';
import type { Compra, ProveedorStats } from '@/lib/calculadoras-financieras';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// GET - Obtiene todos los KPIs avanzados
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    apiLogger.info('📡 GET /api/kpis-avanzados');

    const { searchParams } = new URL(request.url);
    const restauranteId = searchParams.get('restaurante_id');
    const anio = parseInt(searchParams.get('anio') || new Date().getFullYear().toString());
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());
    const presupuesto = parseFloat(searchParams.get('presupuesto') || '0');

    apiLogger.info('Parámetros:', { restauranteId, anio, mes, presupuesto });

    // ============================================================================
    // 1. Obtener compras del mes actual
    // ============================================================================
    const inicioMes = new Date(anio, mes - 1, 1);
    const finMes = new Date(anio, mes, 0, 23, 59, 59);

    const { data: compras, error: comprasError } = await supabase
      .from('compras')
      .select('fecha, total, descripcion, tienda, precio_unitario')
      .gte('fecha', inicioMes.toISOString())
      .lte('fecha', finMes.toISOString())
      .order('fecha', { ascending: true });

    if (comprasError) {
      apiLogger.error('Error obteniendo compras:', comprasError);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener compras',
          details: comprasError.message,
        },
        { status: 500 }
      );
    }

    // Transformar al formato esperado
    const comprasFormateadas: Compra[] = (compras || []).map((c) => ({
      fecha: new Date(c.fecha),
      total: c.total,
      descripcion: c.descripcion,
      tienda: c.tienda,
      precio_unitario: c.precio_unitario,
    }));

    // ============================================================================
    // 2. Obtener stats de proveedores para calcular score
    // ============================================================================
    const { data: proveedoresData, error: proveedoresError } = await supabase
      .from('vista_gasto_por_tienda')
      .select('*')
      .order('gasto_total', { ascending: false });

    let proveedoresStats: ProveedorStats[] = [];
    if (!proveedoresError && proveedoresData) {
      const hoy = new Date();
      const hace90Dias = new Date(hoy);
      hace90Dias.setDate(hace90Dias.getDate() - 90);

      // Para cada proveedor, calcular disponibilidad
      for (const prov of proveedoresData) {
        const { data: comprasProveedor } = await supabase
          .from('compras')
          .select('fecha')
          .eq('tienda', prov.tienda)
          .gte('fecha', hace90Dias.toISOString());

        const diasConCompras = new Set<string>();
        if (comprasProveedor) {
          comprasProveedor.forEach((c) => {
            const fecha = new Date(c.fecha).toDateString();
            diasConCompras.add(fecha);
          });
        }

        const disponibilidad = (diasConCompras.size / 90) * 100;

        proveedoresStats.push({
          proveedor: prov.tienda,
          total_gastado: prov.gasto_total,
          num_compras: prov.total_compras,
          precio_promedio: prov.precio_promedio,
          ultima_compra: new Date(prov.ultima_compra),
          disponibilidad: Math.round(disponibilidad),
        });
      }
    }

    // ============================================================================
    // 3. Obtener compras históricas para cálculo de inflación
    // ============================================================================
    const hace6Meses = new Date(anio, mes - 7, 1);

    const { data: comprasHistoricas, error: historicasError } = await supabase
      .from('compras')
      .select('fecha, total, descripcion, tienda, precio_unitario')
      .gte('fecha', hace6Meses.toISOString())
      .order('fecha', { ascending: true });

    if (historicasError) {
      apiLogger.warn('Error obteniendo compras históricas (inflación):', historicasError);
    }

    const comprasHistoricasFormateadas: Compra[] = (comprasHistoricas || []).map((c) => ({
      fecha: new Date(c.fecha),
      total: c.total,
      descripcion: c.descripcion,
      tienda: c.tienda,
      precio_unitario: c.precio_unitario,
    }));

    // ============================================================================
    // 4. Calcular KPIs avanzados
    // ============================================================================
    const kpis = await calcularKPIsAvanzados(
      [...comprasFormateadas, ...comprasHistoricasFormateadas],
      presupuesto || undefined,
      anio,
      mes,
      proveedoresStats
    );

    // ============================================================================
    // 5. Retornar respuesta
    // ============================================================================
    return NextResponse.json({
      success: true,
      data: kpis,
      params: {
        restaurante_id: restauranteId,
        anio,
        mes,
        presupuesto,
      },
      metadata: {
        compras_analizadas: comprasFormateadas.length,
        compras_historicas: comprasHistoricasFormateadas.length,
        proveedores_analizados: proveedoresStats.length,
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/kpis-avanzados:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al calcular KPIs avanzados',
      },
      { status: 500 }
    );
  }
}
