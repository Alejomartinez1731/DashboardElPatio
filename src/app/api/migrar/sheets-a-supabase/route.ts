/**
 * API para migrar datos de Google Sheets (vía n8n) a Supabase
 *
 * Uso:
 * POST /api/migrar/sheets-a-supabase
 * Body: { secciones: string[], limpiar_previo?: boolean }
 *
 * Ejemplo:
 * {
 *   "secciones": ["compras", "facturas", "proveedores"],
 *   "limpiar_previo": false
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabase, requireSupabaseAdmin } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================================
// POST - Migrar datos de Sheets a Supabase
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secciones = ['compras', 'facturas', 'proveedores'], limpiar_previo = false } = body;

    apiLogger.info('🔄 Iniciando migración de Sheets a Supabase', { secciones, limpiar_previo });
    const supabase = requireSupabaseAdmin();

    // Paso 1: Obtener datos de n8n (Sheets)
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      throw new Error(
        'La variable NEXT_PUBLIC_N8N_WEBHOOK_URL no está configurada. ' +
        'Si ya migraste tus datos a Supabase, ya no necesitas esta herramienta. ' +
        'Para configurar n8n en Vercel, ve a: Settings → Environment Variables → Add New'
      );
    }

    apiLogger.info('Conectando a n8n:', { url: n8nWebhookUrl });

    let response;
    try {
      response = await fetch(n8nWebhookUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Aumentar timeout para conexiones lentas
        signal: AbortSignal.timeout(30000), // 30 segundos
      });
    } catch (fetchError) {
      apiLogger.error('Error de conexión con n8n:', fetchError);
      throw new Error(
        'No se puede conectar con n8n. ' +
        'Verifica que el servicio esté funcionando: ' + n8nWebhookUrl +
        '. Error: ' + (fetchError instanceof Error ? fetchError.message : 'Conexión fallida')
      );
    }

    apiLogger.info('Respuesta de n8n:', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No se pudo obtener el error');
      throw new Error(
        `Error del servidor n8n (${response.status}): ${response.statusText}. ` +
        `Respuesta: ${errorText.substring(0, 200)}`
      );
    }

    const sheetsData = await response.json();

    if (!sheetsData.success) {
      throw new Error('Error en la respuesta de n8n');
    }

    apiLogger.info('✅ Datos obtenidos de n8n', { secciones: Object.keys(sheetsData.data) });

    // Paso 2: Migrar cada sección
    const resultados: Record<string, { exitosos: number; errores: number; errores_detalle: string[] }> = {};

    // === COMPRAS ===
    if (secciones.includes('compras')) {
      apiLogger.info('Migrando compras...');
      const comprasResult = await migrarCompras(sheetsData.data.base_datos || []);
      resultados.compras = comprasResult;
    }

    // === FACTURAS ===
    if (secciones.includes('facturas')) {
      apiLogger.info('Migrando facturas...');
      const facturasResult = await migrarFacturas(sheetsData.data.facturas || []);
      resultados.facturas = facturasResult;
    }

    // === PROVEEDORES ===
    if (secciones.includes('proveedores')) {
      apiLogger.info('Migrando proveedores...');
      const proveedoresResult = await migrarProveedores(sheetsData.data.proveedores || []);
      resultados.proveedores = proveedoresResult;
    }

    // === PRECIOS ===
    if (secciones.includes('precios')) {
      apiLogger.info('Migrando precios...');
      const preciosResult = await migrarPrecios(sheetsData.data.precios || []);
      resultados.precios = preciosResult;
    }

    // === RECORDATORIOS ===
    if (secciones.includes('recordatorios')) {
      apiLogger.info('Migrando recordatorios...');
      const recordatoriosResult = await migrarRecordatorios(sheetsData.data.recordatorios || []);
      resultados.recordatorios = recordatoriosResult;
    }

    apiLogger.info('✅ Migración completada', { resultados });

    return NextResponse.json({
      success: true,
      message: 'Migración completada exitosamente',
      resultados,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en migración:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error durante la migración',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// FUNCIONES DE MIGRACIÓN
// ============================================================================

async function migrarCompras(compras: any[]) {
  const supabase = requireSupabaseAdmin();
  const result = { exitosos: 0, errores: 0, errores_detalle: [] as string[] };

  for (const fila of compras) {
    try {
      // Mapear columnas de Sheets a Supabase
      // Sheets: FECHA, TIENDA, PRODUCTO, PRECIO, CANTIDAD, TOTAL, TELÉFONO, DIRECCIÓN
      const compra = {
        fecha: parsearFecha(fila[0]), // FECHA
        tienda: fila[1], // TIENDA
        descripcion: fila[2], // PRODUCTO
        precio_unitario: parseFloat(fila[3]) || 0, // PRECIO
        cantidad: parseInt(fila[4]) || 1, // CANTIDAD
        total: parseFloat(fila[5]) || 0, // TOTAL
        telefono: fila[6] || null, // TELÉFONO
        direccion: fila[7] || null, // DIRECCIÓN
      };

      const { error } = await supabase.from('compras').insert(compra);

      if (error) {
        // Si es duplicado (unique constraint), no es error
        if (error.code === '23505') {
          apiLogger.warn('Compra duplicada, omitiendo:', compra.descripcion);
        } else {
          throw error;
        }
      } else {
        result.exitosos++;
      }
    } catch (error) {
      result.errores++;
      result.errores_detalle.push(`${fila[2]}: ${(error as Error).message}`);
      apiLogger.error('Error migrando compra:', error);
    }
  }

  return result;
}

async function migrarFacturas(facturas: any[]) {
  const supabase = requireSupabaseAdmin();
  const result = { exitosos: 0, errores: 0, errores_detalle: [] as string[] };

  // Saltar cabecera si existe
  const data = facturas[0]?.[0] === 'FECHA' ? facturas.slice(1) : facturas;

  for (const fila of data) {
    try {
      const factura = {
        fecha: parsearFecha(fila[0]), // FECHA
        tienda: fila[1], // TIENDA
        total: parseFloat(fila[2]) || 0, // TOTAL
        num_productos: parseInt(fila[3]) || 1, // NÚMERO DE PRODUCTOS
        imagen_url: fila[4] || null, // IMAGEN (si existe)
        nombre_archivo: fila[5] || null, // NOMBRE ARCHIVO (si existe)
      };

      const { error } = await supabase.from('facturas').insert(factura);

      if (error) {
        if (error.code === '23505') {
          // Duplicado, omitir
        } else {
          throw error;
        }
      } else {
        result.exitosos++;
      }
    } catch (error) {
      result.errores++;
      result.errores_detalle.push(`${fila[1]}: ${(error as Error).message}`);
    }
  }

  return result;
}

async function migrarProveedores(proveedores: any[]) {
  const supabase = requireSupabaseAdmin();
  const result = { exitosos: 0, errores: 0, errores_detalle: [] as string[] };

  // Saltar cabecera si existe
  const data = proveedores[0]?.[0] === 'PROVEEDOR' ? proveedores.slice(1) : proveedores;

  for (const fila of data) {
    try {
      const proveedor = {
        nombre: fila[0], // PROVEEDOR
        nombre_normalizado: normalizarTexto(fila[0]),
        telefono: fila[1] || null, // TELÉFONO
        direccion: fila[2] || null, // DIRECCIÓN
      };

      const { error } = await supabase.from('proveedores').insert(proveedor);

      if (error) {
        if (error.code === '23505') {
          // Duplicado, omitir
        } else {
          throw error;
        }
      } else {
        result.exitosos++;
      }
    } catch (error) {
      result.errores++;
      result.errores_detalle.push(`${fila[0]}: ${(error as Error).message}`);
    }
  }

  return result;
}

async function migrarPrecios(precios: any[]) {
  const supabase = requireSupabaseAdmin();
  const result = { exitosos: 0, errores: 0, errores_detalle: [] as string[] };

  // Saltar cabecera si existe
  const data = precios[0]?.[0] === 'PRODUCTO' ? precios.slice(1) : precios;

  for (const fila of data) {
    try {
      // Verificar si ya existe este producto/fecha
      const { data: existe } = await supabase
        .from('precios_historico')
        .select('id')
        .eq('producto', fila[0])
        .eq('fecha', parsearFecha(fila[3]))
        .maybeSingle();

      if (!existe) {
        const precio = {
          producto: fila[0], // PRODUCTO
          tienda: fila[1], // TIENDA
          precio: parseFloat(fila[2]) || 0, // PRECIO
          fecha: parsearFecha(fila[3]), // FECHA
          categoria: fila[4] || null, // CATEGORÍA (si existe)
        };

        const { error } = await supabase.from('precios_historico').insert(precio);

        if (error) throw error;
        result.exitosos++;
      }
    } catch (error) {
      result.errores++;
      result.errores_detalle.push(`${fila[0]}: ${(error as Error).message}`);
    }
  }

  return result;
}

async function migrarRecordatorios(recordatorios: any[]) {
  const supabase = requireSupabaseAdmin();
  const result = { exitosos: 0, errores: 0, errores_detalle: [] as string[] };

  // Saltar cabecera si existe
  const data = recordatorios[0]?.[0] === 'PRODUCTO' ? recordatorios.slice(1) : recordatorios;

  for (const fila of data) {
    try {
      const recordatorio = {
        producto: fila[0], // PRODUCTO
        dias: parseInt(fila[1]) || 7, // DÍAS
        activo: fila[2] !== 'NO' && fila[2] !== 'No' && fila[2] !== false, // ACTIVO
        notas: fila[3] || null, // NOTAS
      };

      const { error } = await supabase.from('recordatorios').insert(recordatorio);

      if (error) {
        if (error.code === '23505') {
          // Duplicado, omitir
        } else {
          throw error;
        }
      } else {
        result.exitosos++;
      }
    } catch (error) {
      result.errores++;
      result.errores_detalle.push(`${fila[0]}: ${(error as Error).message}`);
    }
  }

  return result;
}

// ============================================================================
// HELPERS
// ============================================================================

function parsearFecha(fecha: string): string {
  // Manejar diferentes formatos de fecha de Google Sheets
  if (!fecha) return new Date().toISOString();

  // Si ya es ISO string, retornar
  if (fecha.includes('T') && fecha.includes(':')) {
    return fecha;
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const partes = fecha.split(/[/\-]/);
  if (partes.length === 3) {
    const [dia, mes, anio] = partes;
    return new Date(`${anio}-${mes}-${dia}`).toISOString();
  }

  // Si es número serial de Excel
  const num = parseFloat(fecha);
  if (!isNaN(num)) {
    const excelEpoch = new Date(1899, 11, 30);
    const days = Math.floor(num);
    const fechaCalculada = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return fechaCalculada.toISOString();
  }

  return new Date().toISOString();
}

function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .trim()
    .replace(/\s+/g, '_'); // Espacios a guiones bajos
}
