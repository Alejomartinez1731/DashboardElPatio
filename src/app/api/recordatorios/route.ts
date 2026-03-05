import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { validateProductoNombre, validateDias, sanitizeString } from '@/lib/validation';
import { apiLogger } from '@/lib/logger';
import { crearRecordatorioSchema, recordatorioQuerySchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Types
interface UltimaCompra {
  fecha: Date;
  tienda: string;
  precio: number;
}

type RecordatorioEstado = 'vencido' | 'proximo' | 'ok' | 'sin_datos';

interface Recordatorio {
  producto: string;
  diasConfigurados: number;
  ultimaCompra: string | null;
  diasTranscurridos: number | null;
  estado: RecordatorioEstado;
  tiendaUltimaCompra: string | null;
  precioUltimaCompra: number | null;
  notas: string;
  tipo: 'manual' | 'automatico';
}

/**
 * Busca la última compra de un producto en Supabase
 */
async function buscarUltimaCompra(producto: string): Promise<UltimaCompra | null> {
  const productoLower = producto.toLowerCase();

  const { data, error } = await supabase
    .from('compras')
    .select('fecha, tienda, precio_unitario')
    .ilike('descripcion', `%${producto}%`)
    .order('fecha', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const compra = data[0];
  return {
    fecha: new Date(compra.fecha),
    tienda: compra.tienda || '',
    precio: compra.precio_unitario || 0,
  };
}

/**
 * Obtiene todos los productos únicos del historial de compras
 */
async function obtenerProductosUnicos(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('compras')
    .select('descripcion');

  if (error || !data) {
    return new Set();
  }

  const productos = new Set<string>();
  data.forEach(item => {
    const descripcion = item.descripcion?.trim();
    if (descripcion) productos.add(descripcion);
  });

  return productos;
}

/**
 * Calcula la frecuencia de compra promedio de un producto
 */
async function calcularFrecuenciaAutomatica(producto: string): Promise<number | null> {
  const productoLower = producto.toLowerCase();

  const { data, error } = await supabase
    .from('compras')
    .select('fecha')
    .ilike('descripcion', `%${producto}%`)
    .order('fecha', { ascending: false })
    .limit(10);

  if (error || !data || data.length < 2) {
    return null;
  }

  // Extraer fechas y calcular intervalos
  const fechas = data
    .map(item => new Date(item.fecha))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  if (fechas.length < 2) return null;

  const intervalos: number[] = [];
  for (let i = 0; i < fechas.length - 1; i++) {
    const dias = Math.floor((fechas[i].getTime() - fechas[i + 1].getTime()) / (1000 * 60 * 60 * 24));
    if (dias > 0) intervalos.push(dias);
  }

  if (intervalos.length === 0) return null;

  const promedio = intervalos.reduce((sum, val) => sum + val, 0) / intervalos.length;
  return Math.round(promedio * 10) / 10;
}

/**
 * Calcula el estado de un recordatorio
 */
function calcularEstado(diasTranscurridos: number | null, diasConfigurados: number): RecordatorioEstado {
  if (diasTranscurridos === null) return 'sin_datos';
  if (diasTranscurridos >= diasConfigurados) return 'vencido';
  if (diasTranscurridos >= diasConfigurados * 0.7) return 'proximo';
  return 'ok';
}

/**
 * GET - Obtiene todos los recordatorios (manuales + automáticos)
 * Query params:
 * - incluirAutomaticos: "true" | "false" - Si incluye recordatorios automáticos (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    apiLogger.info('📡 GET /api/recordatorios');

    // Obtener query params
    const { searchParams } = new URL(request.url);
    const queryParams = {
      incluirAutomaticos: searchParams.get('incluirAutomaticos') || 'true',
    };

    // Validar query params con Zod
    const validationResult = recordatorioQuerySchema.safeParse(queryParams);

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

    const incluirAutomaticos = validationResult.data.incluirAutomaticos !== 'false';

    apiLogger.info('Query params:', { incluirAutomaticos });

    // PASO 1: Obtener recordatorios manuales de Supabase
    const { data: recordatoriosManuales, error: errorManuales } = await supabase
      .from('recordatorios')
      .select('producto, dias, notas, activo')
      .eq('activo', true);

    if (errorManuales) {
      apiLogger.error('Error obteniendo recordatorios manuales:', errorManuales);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener recordatorios manuales',
          details: errorManuales.message,
        },
        { status: 500 }
      );
    }

    // Map: nombre lowercase -> { nombreOriginal, dias, notas }
    const manualesMap = new Map<string, { nombreOriginal: string; dias: number; notas: string }>();
    (recordatoriosManuales || []).forEach(r => {
      const productoLower = r.producto.toLowerCase();
      manualesMap.set(productoLower, {
        nombreOriginal: r.producto,
        dias: r.dias,
        notas: r.notas || '',
      });
    });

    apiLogger.info('📝 Recordatorios manuales:', manualesMap.size);

    // PASO 2: Obtener todos los productos únicos del historial
    const productosUnicos = await obtenerProductosUnicos();
    apiLogger.info('📦 Productos únicos encontrados:', productosUnicos.size);

    // PASO 3: Agregar productos de recordatorios manuales al conjunto
    for (const [productoLower, data] of manualesMap) {
      productosUnicos.add(data.nombreOriginal);
    }

    apiLogger.info('📦 Productos únicos finales (con manuales):', productosUnicos.size);

    // PASO 4: Generar recordatorios para todos los productos
    const recordatorios: Recordatorio[] = [];
    const procesados = new Set<string>();

    for (const producto of productosUnicos) {
      const productoLower = producto.toLowerCase();

      if (procesados.has(productoLower)) continue;

      // Buscar última compra
      const ultimaCompra = await buscarUltimaCompra(producto);

      let diasTranscurridos: number | null = null;
      let ultimaCompraStr: string | null = null;
      let tiendaUltimaCompra: string | null = null;
      let precioUltimaCompra: number | null = null;
      let diasConfigurados: number;
      let tipo: 'manual' | 'automatico';
      let notas = '';
      let productoFinal = producto;

      if (ultimaCompra && ultimaCompra.fecha.getTime() > 0) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaCompra = new Date(ultimaCompra.fecha);
        fechaCompra.setHours(0, 0, 0, 0);

        diasTranscurridos = Math.floor((hoy.getTime() - fechaCompra.getTime()) / (1000 * 60 * 60 * 24));
        ultimaCompraStr = fechaCompra.toISOString();
        tiendaUltimaCompra = ultimaCompra.tienda;
        precioUltimaCompra = ultimaCompra.precio;
      }

      // Verificar si existe recordatorio manual
      if (manualesMap.has(productoLower)) {
        const manual = manualesMap.get(productoLower)!;
        diasConfigurados = manual.dias;
        tipo = 'manual';
        notas = manual.notas;
        productoFinal = manual.nombreOriginal;
      } else {
        // Calcular frecuencia automática
        const frecuenciaAuto = await calcularFrecuenciaAutomatica(producto);

        if (frecuenciaAuto === null) {
          diasConfigurados = 10;
          tipo = 'automatico';
          notas = '';
        } else {
          const umbralCalculado = Math.round(frecuenciaAuto * 1.5);
          diasConfigurados = Math.max(umbralCalculado, 10);
          tipo = 'automatico';
          notas = '';
        }
      }

      const estado = calcularEstado(diasTranscurridos, diasConfigurados);
      procesados.add(productoLower);

      recordatorios.push({
        producto: productoFinal,
        diasConfigurados,
        ultimaCompra: ultimaCompraStr,
        diasTranscurridos,
        estado,
        tiendaUltimaCompra,
        precioUltimaCompra,
        notas,
        tipo,
      });
    }

    apiLogger.info('✅ Recordatorios procesados:', recordatorios.length);

    // PASO 5: Filtrar según incluirAutomaticos
    let recordatoriosFiltrados = recordatorios;
    if (!incluirAutomaticos) {
      recordatoriosFiltrados = recordatorios.filter(r => r.tipo === 'manual');
      apiLogger.info('🔒 Filtrados automáticos - solo manuales:', recordatoriosFiltrados.length);
    }

    // PASO 6: Ordenar por urgencia
    recordatoriosFiltrados.sort((a, b) => {
      const orden = { vencido: 0, proximo: 1, sin_datos: 2, ok: 3 };
      const ordenA = orden[a.estado as keyof typeof orden];
      const ordenB = orden[b.estado as keyof typeof orden];

      if (ordenA !== ordenB) return ordenA - ordenB;

      if (a.tipo !== b.tipo) {
        return a.tipo === 'manual' ? -1 : 1;
      }

      if (a.estado === 'vencido') {
        return (b.diasTranscurridos || 0) - (a.diasTranscurridos || 0);
      }
      if (a.estado === 'proximo' || a.estado === 'ok') {
        return (a.diasTranscurridos || 0) - (b.diasTranscurridos || 0);
      }
      return 0;
    });

    const debugInfo = {
      productosUnicos: productosUnicos.size,
      manuales: manualesMap.size,
      automaticos: recordatorios.length - manualesMap.size,
      filtrados: recordatoriosFiltrados.length,
      incluirAutomaticos,
      porEstado: {
        vencido: recordatoriosFiltrados.filter(r => r.estado === 'vencido').length,
        proximo: recordatoriosFiltrados.filter(r => r.estado === 'proximo').length,
        ok: recordatoriosFiltrados.filter(r => r.estado === 'ok').length,
        sin_datos: recordatoriosFiltrados.filter(r => r.estado === 'sin_datos').length,
      },
    };

    return NextResponse.json({
      success: true,
      data: recordatoriosFiltrados,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/recordatorios:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener recordatorios',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Añade un nuevo recordatorio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    apiLogger.info('POST /api/recordatorios', { body });

    // Validar con Zod
    const validationResult = crearRecordatorioSchema.safeParse(body);

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

    const { producto, dias, notas } = validationResult.data;

    // Sanitizar
    const productoSanitizado = sanitizeString(producto);
    const diasSanitizado = dias;
    const notasSanitizado = sanitizeString(notas || '');

    // Verificar duplicados
    const { data: existente, error: errorCheck } = await supabase
      .from('recordatorios')
      .select('id, producto, activo')
      .ilike('producto', productoSanitizado)
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
        { success: false, error: `Ya existe un recordatorio para "${producto}"` },
        { status: 409 }
      );
    }

    // Insertar en Supabase
    const { data: nuevoRecordatorio, error: errorInsert } = await supabase
      .from('recordatorios')
      .insert({
        producto: productoSanitizado,
        dias: diasSanitizado,
        notas: notasSanitizado,
        activo: true,
      })
      .select()
      .single();

    if (errorInsert) {
      apiLogger.error('Error insertando recordatorio:', errorInsert);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear recordatorio',
          details: errorInsert.message,
        },
        { status: 500 }
      );
    }

    apiLogger.info('✅ Recordatorio creado:', nuevoRecordatorio);

    return NextResponse.json({
      success: true,
      message: 'Recordatorio creado correctamente',
      data: {
        producto: productoSanitizado,
        dias: diasSanitizado,
        notas: notasSanitizado,
      },
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en POST /api/recordatorios:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al crear recordatorio',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Elimina (desactiva) un recordatorio
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    apiLogger.info('🗑️ DELETE /api/recordatorios');
    apiLogger.info('  Body recibido:', body);

    // Validar con Zod
    const deleteSchema = crearRecordatorioSchema.pick({ producto: true });
    const validationResult = deleteSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      apiLogger.error('❌ Validación fallida', { errors });
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { producto } = validationResult.data;

    // Desactivar en lugar de eliminar (soft delete)
    const { error: errorUpdate } = await supabase
      .from('recordatorios')
      .update({ activo: false })
      .ilike('producto', producto.trim())
      .eq('activo', true);

    if (errorUpdate) {
      apiLogger.error('Error desactivando recordatorio:', errorUpdate);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al eliminar recordatorio',
          details: errorUpdate.message,
        },
        { status: 500 }
      );
    }

    apiLogger.info('✅ Recordatorio desactivado:', producto);

    return NextResponse.json({
      success: true,
      message: 'Recordatorio eliminado correctamente',
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error & { stack?: string };
    apiLogger.error('❌ Error en DELETE /api/recordatorios:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al eliminar recordatorio',
      },
      { status: 500 }
    );
  }
}
