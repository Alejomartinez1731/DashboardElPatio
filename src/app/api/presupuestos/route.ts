import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeString } from '@/lib/validation';
import { apiLogger } from '@/lib/logger';
import {
  crearPresupuestoSchema,
  actualizarPresupuestoSchema,
  presupuestoQuerySchema,
  type PresupuestoVsGasto,
  type CrearPresupuestoInput,
  type ActualizarPresupuestoInput,
  determinarEstadoAlerta,
} from '@/lib/schemas';
import { CategoriaProducto } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// GET - Obtiene presupuestos con comparación de gasto
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    apiLogger.info('📡 GET /api/presupuestos');

    // Obtener query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
      categoria: searchParams.get('categoria') || undefined,
      mes: searchParams.get('mes') || undefined,
      anio: searchParams.get('anio') || undefined,
      incluir_inactivos: searchParams.get('incluir_inactivos') || 'false',
    };

    // Validar query params con Zod
    const validationResult = presupuestoQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      apiLogger.warn('Query params inválidos', { errors });
      return NextResponse.json(
        {
          success: false,
          error: 'Parámetros inválidos',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { categoria, mes, anio, incluir_inactivos } = validationResult.data;

    apiLogger.info('Query params:', { categoria, mes, anio, incluir_inactivos });

    // Construir query
    let query = supabase
      .from('vista_presupuesto_vs_gasto')
      .select('*')
      .order('categoria', { ascending: true });

    // Aplicar filtros
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (mes) {
      query = query.eq('periodo_mes', mes);
    }

    if (anio) {
      query = query.eq('periodo_anio', anio);
    }

    if (incluir_inactivos !== 'true') {
      query = query.eq('activo', true);
    }

    const { data: presupuestos, error } = await query;

    if (error) {
      apiLogger.error('Error obteniendo presupuestos:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener presupuestos',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Enriquecer datos con estado de alerta
    const presupuestosConEstado = (presupuestos || []).map((p: PresupuestoVsGasto) => ({
      ...p,
      estado_alerta: determinarEstadoAlerta(p.porcentaje_usado),
    }));

    // Calcular totales
    const totalPresupuesto = presupuestosConEstado.reduce((sum, p) => sum + (p.presupuesto || 0), 0);
    const totalGastado = presupuestosConEstado.reduce((sum, p) => sum + (p.gasto_actual || 0), 0);
    const porcentajeTotal = totalPresupuesto > 0 ? (totalGastado / totalPresupuesto) * 100 : 0;

    apiLogger.info('✅ Presupuestos obtenidos:', presupuestosConEstado.length);

    return NextResponse.json({
      success: true,
      data: presupuestosConEstado,
      resumen: {
        total_presupuesto: Math.round(totalPresupuesto * 100) / 100,
        total_gastado: Math.round(totalGastado * 100) / 100,
        porcentaje_usado: Math.round(porcentajeTotal * 100) / 100,
        diferencia: Math.round((totalPresupuesto - totalGastado) * 100) / 100,
        estado_alerta: determinarEstadoAlerta(porcentajeTotal),
      },
      timestamp: new Date().toISOString(),
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/presupuestos:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener presupuestos',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Crea un nuevo presupuesto por categoría
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    apiLogger.info('POST /api/presupuestos', { body });

    // Validar con Zod
    const validationResult = crearPresupuestoSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      apiLogger.warn('Validación fallida', { errors });
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { categoria, monto, periodo_mes, periodo_anio, notas } = validationResult.data;

    // Sanitizar notas
    const notasSanitizadas = sanitizeString(notas || '');

    // Verificar duplicados
    const { data: existente, error: errorCheck } = await supabase
      .from('presupuestos_categoria')
      .select('id, categoria, periodo_mes, periodo_anio')
      .eq('categoria', categoria)
      .eq('periodo_mes', periodo_mes)
      .eq('periodo_anio', periodo_anio)
      .eq('activo', true)
      .limit(1);

    if (errorCheck) {
      apiLogger.error('Error verificando duplicados:', errorCheck);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al verificar duplicados',
          details: errorCheck.message,
        },
        { status: 500 }
      );
    }

    if (existente && existente.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ya existe un presupuesto activo para la categoría "${categoria}" en ${periodo_mes}/${periodo_anio}`,
        },
        { status: 409 }
      );
    }

    // Insertar en Supabase
    const { data: nuevoPresupuesto, error: errorInsert } = await supabase
      .from('presupuestos_categoria')
      .insert({
        categoria,
        monto,
        periodo_mes,
        periodo_anio,
        notas: notasSanitizadas || null,
        activo: true,
      })
      .select()
      .single();

    if (errorInsert) {
      apiLogger.error('Error insertando presupuesto:', errorInsert);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear presupuesto',
          details: errorInsert.message,
        },
        { status: 500 }
      );
    }

    apiLogger.info('✅ Presupuesto creado:', nuevoPresupuesto);

    return NextResponse.json(
      {
        success: true,
        message: 'Presupuesto creado correctamente',
        data: nuevoPresupuesto,
        _source: 'supabase',
      },
      { status: 201 }
    );
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en POST /api/presupuestos:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al crear presupuesto',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Actualiza un presupuesto existente
// ============================================================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    apiLogger.info('PATCH /api/presupuestos', { body });

    // Validar que se proporciona el ID
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID del presupuesto es requerido',
        },
        { status: 400 }
      );
    }

    // Validar con Zod (usar schema de actualización)
    const validationResult = actualizarPresupuestoSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      apiLogger.warn('Validación fallida', { errors });
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: errors,
        },
        { status: 400 }
      );
    }

    const updateData: ActualizarPresupuestoInput = validationResult.data;

    // Sanitizar notas si se proporcionan
    if (updateData.notas !== undefined) {
      updateData.notas = sanitizeString(updateData.notas);
    }

    // Actualizar en Supabase
    const { data: presupuestoActualizado, error: errorUpdate } = await supabase
      .from('presupuestos_categoria')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (errorUpdate) {
      apiLogger.error('Error actualizando presupuesto:', errorUpdate);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al actualizar presupuesto',
          details: errorUpdate.message,
        },
        { status: 500 }
      );
    }

    if (!presupuestoActualizado) {
      return NextResponse.json(
        {
          success: false,
          error: 'Presupuesto no encontrado',
        },
        { status: 404 }
      );
    }

    apiLogger.info('✅ Presupuesto actualizado:', presupuestoActualizado);

    return NextResponse.json({
      success: true,
      message: 'Presupuesto actualizado correctamente',
      data: presupuestoActualizado,
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en PATCH /api/presupuestos:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al actualizar presupuesto',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Elimina (desactiva) un presupuesto
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    apiLogger.info('🗑️ DELETE /api/presupuestos');
    apiLogger.info('  Body recibido:', body);

    // Validar que se proporciona el ID
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'El ID del presupuesto es requerido',
        },
        { status: 400 }
      );
    }

    // Desactivar en lugar de eliminar (soft delete)
    const { error: errorUpdate } = await supabase
      .from('presupuestos_categoria')
      .update({ activo: false })
      .eq('id', body.id);

    if (errorUpdate) {
      apiLogger.error('Error desactivando presupuesto:', errorUpdate);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al eliminar presupuesto',
          details: errorUpdate.message,
        },
        { status: 500 }
      );
    }

    apiLogger.info('✅ Presupuesto desactivado:', body.id);

    return NextResponse.json({
      success: true,
      message: 'Presupuesto eliminado correctamente',
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error & { stack?: string };
    apiLogger.error('❌ Error en DELETE /api/presupuestos:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al eliminar presupuesto',
      },
      { status: 500 }
    );
  }
}
