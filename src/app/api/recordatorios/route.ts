import { NextRequest, NextResponse } from 'next/server';
import { validateProductoNombre, validateDias, sanitizeString } from '@/lib/validation';
import { apiLogger } from '@/lib/logger';
import { crearRecordatorioSchema, recordatorioQuerySchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración de n8n (server-side only, no NEXT_PUBLIC_)
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_RECORDATORIOS_WEBHOOK_URL = process.env.N8N_RECORDATORIOS_WEBHOOK_URL;

// Nombres de las hojas
const HOJA_RECORDATORIOS = 'Recordatorios';
const HOJA_REGISTRO_DIARIO = 'Registro Diario';
const HOJA_HISTORICO_PRECIOS = 'Histórico de Precios';

// Types
interface UltimaCompra {
  fecha: Date;
  tienda: string;
  precio: number;
}

interface NormalizedCabeceras {
  fecha: number;
  tienda: number;
  descripcion: number;
  precio: number;
  [key: string]: number;
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
 * Obtiene los datos de n8n (todas las hojas)
 */
async function getAllSheetsData(): Promise<Record<string, string[][]>> {
  if (!N8N_WEBHOOK_URL) {
    apiLogger.error('❌ N8N_WEBHOOK_URL no configurado');
    return {
      recordatorios: [],
      registro_diario: [],
      historico_precios: [],
    };
  }

  try {
    apiLogger.info('📡 Llamando a n8n para todas las hojas...');
    const response = await fetch(N8N_WEBHOOK_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      apiLogger.error('❌ n8n respondió con status:', response.status);
      throw new Error(`n8n falló con status ${response.status}`);
    }

    const result = await response.json();
    apiLogger.info('✅ n8n respondió');
    apiLogger.info('📦 Claves en result:', Object.keys(result));
    apiLogger.info('📦 Claves en result.data:', Object.keys(result.data || {}));

    // n8n devuelve: { success: true, data: { recordatorios: { values: [...] } } }
    const data = result.data || {};

    return {
      recordatorios: data.recordatorios?.values || [],
      registro_diario: data.registro_diario?.values || [],
      historico_precios: data.historico_precios?.values || [],
    };
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error obteniendo datos de n8n:', err.message);
    return {
      recordatorios: [],
      registro_diario: [],
      historico_precios: [],
    };
  }
}

/**
 * Busca la última compra de un producto en las hojas de datos
 * Búsqueda parcial (case-insensitive)
 */
function buscarUltimaCompra(producto: string, registroDiario: string[][], historico: string[][]): UltimaCompra | null {
  const productoLower = producto.toLowerCase();
  let ultimaCompra: UltimaCompra | null = null;

  // Buscar en Registro Diario primero (más reciente)
  if (registroDiario.length > 1) {
    const cabeceras = normalizarCabeceras(registroDiario[0]);
    for (let i = 1; i < registroDiario.length; i++) {
      const fila = registroDiario[i];
      if (fila.length < 3) continue;

      const idxDesc = cabeceras.descripcion ?? 2;
      const descripcion = String(fila[idxDesc] || '').toLowerCase();
      if (descripcion.includes(productoLower) || productoLower.includes(descripcion)) {
        const idxFecha = cabeceras.fecha ?? 0;
        const fecha = parsearFecha(fila[idxFecha] || '');
        if (!ultimaCompra || fecha > ultimaCompra.fecha) {
          const idxTienda = cabeceras.tienda ?? 1;
          const idxPrecio = cabeceras.precio ?? 3;
          ultimaCompra = {
            fecha,
            tienda: fila[idxTienda] || '',
            precio: parseFloat(fila[idxPrecio] || '0') || 0,
          };
        }
      }
    }
  }

  // Buscar en Histórico de Precios si no se encontró en Registro Diario
  if (historico.length > 1) {
    const cabeceras = normalizarCabeceras(historico[0]);
    for (let i = 1; i < historico.length; i++) {
      const fila = historico[i];
      if (fila.length < 3) continue;

      const idxDesc = cabeceras.descripcion ?? 2;
      const descripcion = String(fila[idxDesc] || '').toLowerCase();
      if (descripcion.includes(productoLower) || productoLower.includes(descripcion)) {
        const idxFecha = cabeceras.fecha ?? 0;
        const fecha = parsearFecha(fila[idxFecha] || '');
        if (!ultimaCompra || fecha > ultimaCompra.fecha) {
          const idxTienda = cabeceras.tienda ?? 1;
          const idxPrecio = cabeceras.precio ?? 3;
          ultimaCompra = {
            fecha,
            tienda: fila[idxTienda] || '',
            precio: parseFloat(fila[idxPrecio] || '0') || 0,
          };
        }
      }
    }
  }

  return ultimaCompra;
}

/**
 * Normaliza cabeceras para encontrar índices de columnas
 */
function normalizarCabeceras(cabeceras: string[]): NormalizedCabeceras {
  const normalized: NormalizedCabeceras = {
    fecha: 0,        // Default: primera columna
    tienda: 1,       // Default: segunda columna
    descripcion: 2,  // Default: tercera columna
    precio: 3,       // Default: cuarta columna
  };
  cabeceras.forEach((cab, idx) => {
    const cabLower = String(cab).toLowerCase().trim();
    if (cabLower.includes('fecha') || cabLower === 'date') normalized.fecha = idx;
    else if (cabLower.includes('tienda') || cabLower === 'store') normalized.tienda = idx;
    else if (cabLower.includes('descripcion') || cabLower.includes('descripción') || cabLower.includes('producto') || cabLower === 'product') normalized.descripcion = idx;
    else if (cabLower.includes('precio')) normalized.precio = idx;
  });
  return normalized;
}

/**
 * Parsea una fecha de string a Date
 */
function parsearFecha(fechaStr: string): Date {
  if (!fechaStr) return new Date(0);

  // Intentar formato ISO (YYYY-MM-DD)
  const isoMatch = fechaStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }

  // Intentar formato europeo (DD/MM/YYYY)
  const euMatch = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (euMatch) {
    return new Date(parseInt(euMatch[3]), parseInt(euMatch[2]) - 1, parseInt(euMatch[1]));
  }

  return new Date(0);
}

/**
 * Extrae todos los productos únicos del historial de compras
 */
function obtenerProductosUnicos(registroDiario: string[][], historico: string[][]): Set<string> {
  const productos = new Set<string>();

  // Procesar Registro Diario
  if (registroDiario.length > 1) {
    const cabeceras = normalizarCabeceras(registroDiario[0]);
    for (let i = 1; i < registroDiario.length; i++) {
      const fila = registroDiario[i];
      if (fila.length < 3) continue;
      const descripcion = String(fila[cabeceras.descripcion] || fila[2] || '').trim();
      if (descripcion) productos.add(descripcion);
    }
  }

  // Procesar Histórico
  if (historico.length > 1) {
    const cabeceras = normalizarCabeceras(historico[0]);
    for (let i = 1; i < historico.length; i++) {
      const fila = historico[i];
      if (fila.length < 3) continue;
      const descripcion = String(fila[cabeceras.descripcion] || fila[2] || '').trim();
      if (descripcion) productos.add(descripcion);
    }
  }

  return productos;
}

/**
 * Calcula la frecuencia de compra promedio de un producto
 * Basado en el historial de compras
 */
function calcularFrecuenciaAutomatica(producto: string, registroDiario: string[][], historico: string[][]): number | null {
  const productoLower = producto.toLowerCase();
  const fechas: Date[] = [];

  // Buscar todas las compras en Registro Diario
  if (registroDiario.length > 1) {
    const cabeceras = normalizarCabeceras(registroDiario[0]);
    for (let i = 1; i < registroDiario.length; i++) {
      const fila = registroDiario[i];
      if (fila.length < 3) continue;
      const descripcion = String(fila[cabeceras.descripcion] || fila[2] || '').toLowerCase();
      if (descripcion.includes(productoLower) || productoLower.includes(descripcion)) {
        const fecha = parsearFecha(fila[cabeceras.fecha] || fila[0] || '');
        if (fecha.getTime() > 0) fechas.push(fecha);
      }
    }
  }

  // Buscar en Histórico si hay pocas fechas
  if (fechas.length < 2 && historico.length > 1) {
    const cabeceras = normalizarCabeceras(historico[0]);
    for (let i = 1; i < historico.length; i++) {
      const fila = historico[i];
      if (fila.length < 3) continue;
      const descripcion = String(fila[cabeceras.descripcion] || fila[2] || '').toLowerCase();
      if (descripcion.includes(productoLower) || productoLower.includes(descripcion)) {
        const fecha = parsearFecha(fila[cabeceras.fecha] || fila[0] || '');
        if (fecha.getTime() > 0) fechas.push(fecha);
      }
    }
  }

  // Necesitamos al menos 2 compras para calcular frecuencia
  if (fechas.length < 2) return null;

  // Ordenar fechas descendente (más reciente primero)
  fechas.sort((a, b) => b.getTime() - a.getTime());

  // Calcular intervalos entre las últimas compras
  // Usamos las últimas 10 compras como máximo
  const intervalos: number[] = [];
  const maxCompras = Math.min(fechas.length, 10);

  for (let i = 0; i < maxCompras - 1; i++) {
    const dias = Math.floor((fechas[i].getTime() - fechas[i + 1].getTime()) / (1000 * 60 * 60 * 24));
    if (dias > 0) intervalos.push(dias);
  }

  if (intervalos.length === 0) return null;

  // Calcular promedio de intervalos
  const promedio = intervalos.reduce((sum, val) => sum + val, 0) / intervalos.length;

  // Redondear a 1 decimal
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

    // Obtener TODOS los datos de n8n en una sola llamada
    const sheetsData = await getAllSheetsData();

    const recordatoriosRaw = sheetsData.recordatorios;
    const registroDiario = sheetsData.registro_diario;
    const historico = sheetsData.historico_precios;

    apiLogger.info('Datos recibidos de n8n', {
      recordatorios: recordatoriosRaw.length,
      registro_diario: registroDiario.length,
      historico_precios: historico.length
    });

    // PASO 1: Obtener todos los productos únicos del historial
    const productosUnicos = obtenerProductosUnicos(registroDiario, historico);
    apiLogger.info('📦 Productos únicos encontrados:', productosUnicos.size);

    // PASO 2: Procesar recordatorios manuales
    // Map: nombre lowercase -> { nombreOriginal, dias, notas }
    const recordatoriosManuales = new Map<string, { nombreOriginal: string; dias: number; notas: string }>();

    if (recordatoriosRaw.length > 1) {
      const headers = recordatoriosRaw[0].map((h: string) => String(h).trim().toLowerCase());
      const idxProducto = headers.findIndex(h => h.includes('producto'));
      const idxDias = headers.findIndex(h => h.includes('días') || h === 'dias');
      const idxActivo = headers.findIndex(h => h.includes('activo'));
      const idxNotas = headers.findIndex(h => h.includes('notas'));

      for (let i = 1; i < recordatoriosRaw.length; i++) {
        const fila = recordatoriosRaw[i];
        if (fila.length < 2) continue;

        const producto = String(fila[idxProducto] || '').trim();
        const dias = parseInt(String(fila[idxDias] || '0')) || 0;
        const activoRaw = String(fila[idxActivo] || 'TRUE').trim().toUpperCase();
        const activo = activoRaw === 'TRUE' || activoRaw === 'SI' || activoRaw === '1';
        const notas = String(fila[idxNotas] || '').trim();

        if (producto && activo && dias > 0) {
          const productoLower = producto.toLowerCase();
          recordatoriosManuales.set(productoLower, { nombreOriginal: producto, dias, notas });
        }
      }
    }

    apiLogger.info('📝 Recordatorios manuales:', recordatoriosManuales.size);

    // PASO 2.5: Agregar productos de recordatorios manuales al conjunto
    // Esto asegura que productos solo configurados manualmente también aparezcan
    for (const [productoLower, data] of recordatoriosManuales) {
      productosUnicos.add(data.nombreOriginal);
    }

    apiLogger.info('📦 Productos únicos finales (con manuales):', productosUnicos.size);

    // PASO 3: Generar recordatorios para todos los productos
    const recordatorios: Recordatorio[] = [];
    const procesados = new Set<string>(); // Evitar duplicados

    for (const producto of productosUnicos) {
      const productoLower = producto.toLowerCase();

      // Evitar procesar duplicados (cuando un producto aparece en historial y en manual)
      if (procesados.has(productoLower)) {
        continue;
      }

      // Buscar última compra
      const ultimaCompra = buscarUltimaCompra(producto, registroDiario, historico);

      let diasTranscurridos: number | null = null;
      let ultimaCompraStr: string | null = null;
      let tiendaUltimaCompra: string | null = null;
      let precioUltimaCompra: number | null = null;
      let diasConfigurados: number;
      let tipo: 'manual' | 'automatico';
      let notas = '';
      let productoFinal = producto; // Nombre que se usará en el recordatorio

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
      if (recordatoriosManuales.has(productoLower)) {
        const manual = recordatoriosManuales.get(productoLower)!;
        diasConfigurados = manual.dias;
        tipo = 'manual';
        notas = manual.notas;
        // Usar el nombre original del manual para consistencia
        productoFinal = manual.nombreOriginal;
      } else {
        // Calcular frecuencia automática
        const frecuenciaAuto = calcularFrecuenciaAutomatica(producto, registroDiario, historico);

        if (frecuenciaAuto === null) {
          // No hay suficientes datos, usar umbral por defecto (mínimo 10 días)
          diasConfigurados = 10;
          tipo = 'automatico';
          notas = '';
        } else {
          // Usar frecuencia promedio * 1.5 como umbral, con MÍNIMO de 10 días
          const umbralCalculado = Math.round(frecuenciaAuto * 1.5);
          diasConfigurados = Math.max(umbralCalculado, 10);
          tipo = 'automatico';
          notas = '';
        }
      }

      const estado = calcularEstado(diasTranscurridos, diasConfigurados);

      // Marcar como procesado para evitar duplicados
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

    // PASO 4: Filtrar según incluirAutomaticos
    let recordatoriosFiltrados = recordatorios;
    if (!incluirAutomaticos) {
      // Solo incluir manuales
      recordatoriosFiltrados = recordatorios.filter(r => r.tipo === 'manual');
      apiLogger.info('🔒 Filtrados automáticos - solo manuales:', recordatoriosFiltrados.length);
    }

    // PASO 5: Ordenar por urgencia
    recordatoriosFiltrados.sort((a, b) => {
      const orden = { vencido: 0, proximo: 1, sin_datos: 2, ok: 3 };
      const ordenA = orden[a.estado as keyof typeof orden];
      const ordenB = orden[b.estado as keyof typeof orden];

      if (ordenA !== ordenB) return ordenA - ordenB;

      // Prioridad: manuales antes que automáticos
      if (a.tipo !== b.tipo) {
        return a.tipo === 'manual' ? -1 : 1;
      }

      // Dentro del mismo estado, ordenar por días
      if (a.estado === 'vencido') {
        return (b.diasTranscurridos || 0) - (a.diasTranscurridos || 0);
      }
      if (a.estado === 'proximo' || a.estado === 'ok') {
        return (a.diasTranscurridos || 0) - (b.diasTranscurridos || 0);
      }
      return 0;
    });

    // Debug info
    const debugInfo = {
      sheetsDataKeys: Object.keys(sheetsData),
      recordatoriosRaw: recordatoriosRaw.length,
      productosUnicos: productosUnicos.size,
      manuales: recordatoriosManuales.size,
      automaticos: recordatorios.length - recordatoriosManuales.size,
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

    // Sanitizar adicional (defence in depth)
    const productoSanitizado = sanitizeString(producto);
    const diasSanitizado = dias;
    const notasSanitizado = sanitizeString(notas || '');

    // Verificar duplicados
    const sheetsData = await getAllSheetsData();
    const recordatoriosRaw = sheetsData.recordatorios;
    const productoLower = productoSanitizado.toLowerCase();

    if (recordatoriosRaw.length > 1) {
      for (let i = 1; i < recordatoriosRaw.length; i++) {
        const fila = recordatoriosRaw[i];
        if (fila.length > 0) {
          const productoExistente = String(fila[0] || '').trim().toLowerCase();
          const activo = String(fila[2] || 'TRUE').toUpperCase() === 'TRUE';

          if (productoExistente === productoLower && activo) {
            return NextResponse.json(
              { success: false, error: `Ya existe un recordatorio para "${producto}"` },
              { status: 409 }
            );
          }
        }
      }
    }

    // Intentar guardar vía n8n
    if (N8N_RECORDATORIOS_WEBHOOK_URL) {
      apiLogger.debug('Enviando a n8n', {
        action: 'append',
        sheet: HOJA_RECORDATORIOS,
        row: [productoSanitizado, diasSanitizado.toString(), 'TRUE', notasSanitizado],
      });

      const response = await fetch(N8N_RECORDATORIOS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'append',
          sheet: HOJA_RECORDATORIOS,
          row: [productoSanitizado, diasSanitizado.toString(), 'TRUE', notasSanitizado],
        }),
      });

      apiLogger.info('📡 Respuesta n8n status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        apiLogger.error('❌ n8n append falló:', text);
        return NextResponse.json(
          { success: false, error: 'Error al guardar en n8n. Verifica que el webhook esté configurado correctamente.' },
          { status: 500 }
        );
      }

      const result = await response.json();
      apiLogger.info('✅ n8n append éxito:', result);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Error al guardar' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay webhook de n8n configurado para guardar recordatorios.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recordatorio creado correctamente',
      data: {
        producto: productoSanitizado,
        dias: diasSanitizado,
        notas: notasSanitizado,
      },
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
 * DELETE - Elimina un recordatorio
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    apiLogger.info('🗑️ DELETE /api/recordatorios');
    apiLogger.info('  Body recibido:', body);

    // Validar con Zod (producto es requerido)
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

    // Intentar eliminar vía n8n
    if (N8N_RECORDATORIOS_WEBHOOK_URL) {
      const payload = {
        action: 'delete',
        sheet: HOJA_RECORDATORIOS,
        producto: producto.trim(),
      };

      apiLogger.info('📤 Enviando a n8n DELETE:', payload);

      const response = await fetch(N8N_RECORDATORIOS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      apiLogger.info('📡 Respuesta n8n status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        apiLogger.error('❌ n8n delete falló (status ' + response.status + '):', text);
        return NextResponse.json(
          { success: false, error: 'Error al eliminar en n8n. Status: ' + response.status },
          { status: response.status }
        );
      }

      const result = await response.json();
      apiLogger.info('✅ n8n delete resultado:', result);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Error al eliminar' },
          { status: 500 }
        );
      }
    } else {
      apiLogger.error('❌ N8N_RECORDATORIOS_WEBHOOK_URL no configurado');
      return NextResponse.json(
        {
          success: false,
          error: 'No hay webhook de n8n configurado para eliminar recordatorios.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recordatorio eliminado correctamente',
    });
  } catch (error) {
    const err = error as Error & { stack?: string };
    apiLogger.error('❌ Error en DELETE /api/recordatorios:', err);
    apiLogger.error('  Error stack:', err.stack);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al eliminar recordatorio',
      },
      { status: 500 }
    );
  }
}
