import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración de n8n
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
const N8N_RECORDATORIOS_WEBHOOK = process.env.N8N_RECORDATORIOS_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_RECORDATORIOS_WEBHOOK_URL;

// Debug: mostrar variables al iniciar
console.log('🔧 Variables de entorno n8n:');
console.log('  - N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL ? '✓ configurado' : '✗ NO configurado');
console.log('  - N8N_RECORDATORIOS_WEBHOOK_URL:', process.env.N8N_RECORDATORIOS_WEBHOOK_URL || 'undefined');
console.log('  - NEXT_PUBLIC_N8N_RECORDATORIOS_WEBHOOK_URL:', process.env.NEXT_PUBLIC_N8N_RECORDATORIOS_WEBHOOK_URL || 'undefined');
console.log('  - N8N_RECORDATORIOS_WEBHOOK final:', N8N_RECORDATORIOS_WEBHOOK || 'undefined');

// Nombres de las hojas
const HOJA_RECORDATORIOS = 'Recordatorios';
const HOJA_REGISTRO_DIARIO = 'Registro Diario';
const HOJA_HISTORICO_PRECIOS = 'Histórico de Precios';

/**
 * Obtiene los datos de n8n (todas las hojas)
 */
async function getAllSheetsData(): Promise<Record<string, string[][]>> {
  if (!N8N_WEBHOOK_URL) {
    console.error('❌ N8N_WEBHOOK_URL no configurado');
    return {
      recordatorios: [],
      registro_diario: [],
      historico_precios: [],
    };
  }

  try {
    console.log('📡 Llamando a n8n para todas las hojas...');
    const response = await fetch(N8N_WEBHOOK_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('❌ n8n respondió con status:', response.status);
      throw new Error(`n8n falló con status ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ n8n respondió');
    console.log('📦 Claves en result:', Object.keys(result));
    console.log('📦 Claves en result.data:', Object.keys(result.data || {}));

    // n8n devuelve: { success: true, data: { recordatorios: { values: [...] } } }
    const data = result.data || {};

    return {
      recordatorios: data.recordatorios?.values || [],
      registro_diario: data.registro_diario?.values || [],
      historico_precios: data.historico_precios?.values || [],
    };
  } catch (error: any) {
    console.error('❌ Error obteniendo datos de n8n:', error.message);
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
function buscarUltimaCompra(producto: string, registroDiario: string[][], historico: string[][]) {
  const productoLower = producto.toLowerCase();
  let ultimaCompra: any = null;

  // Buscar en Registro Diario primero (más reciente)
  if (registroDiario.length > 1) {
    const cabeceras = normalizarCabeceras(registroDiario[0]);
    for (let i = 1; i < registroDiario.length; i++) {
      const fila = registroDiario[i];
      if (fila.length < 3) continue;

      const descripcion = String(fila[cabeceras.descripcion] || fila[2] || '').toLowerCase();
      if (descripcion.includes(productoLower) || productoLower.includes(descripcion)) {
        const fecha = parsearFecha(fila[cabeceras.fecha] || fila[0] || '');
        if (!ultimaCompra || fecha > ultimaCompra.fecha) {
          ultimaCompra = {
            fecha,
            tienda: fila[cabeceras.tienda] || fila[1] || '',
            precio: parseFloat(fila[cabeceras.precio] || fila[3] || '0') || 0,
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

      const descripcion = String(fila[cabeceras.descripcion] || fila[2] || '').toLowerCase();
      if (descripcion.includes(productoLower) || productoLower.includes(descripcion)) {
        const fecha = parsearFecha(fila[cabeceras.fecha] || fila[0] || '');
        if (!ultimaCompra || fecha > ultimaCompra.fecha) {
          ultimaCompra = {
            fecha,
            tienda: fila[cabeceras.tienda] || fila[1] || '',
            precio: parseFloat(fila[cabeceras.precio] || fila[3] || '0') || 0,
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
function normalizarCabeceras(cabeceras: any[]): Record<string, number> {
  const normalized: Record<string, number> = {};
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
function calcularEstado(diasTranscurridos: number | null, diasConfigurados: number): string {
  if (diasTranscurridos === null) return 'sin_datos';
  if (diasTranscurridos >= diasConfigurados) return 'vencido';
  if (diasTranscurridos >= diasConfigurados * 0.7) return 'proximo';
  return 'ok';
}

/**
 * GET - Obtiene todos los recordatorios (manuales + automáticos)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📡 GET /api/recordatorios');

    // Obtener TODOS los datos de n8n en una sola llamada
    const sheetsData = await getAllSheetsData();

    const recordatoriosRaw = sheetsData.recordatorios;
    const registroDiario = sheetsData.registro_diario;
    const historico = sheetsData.historico_precios;

    console.log('📊 Datos recibidos de n8n:');
    console.log('  - recordatorios:', recordatoriosRaw.length, 'filas');
    console.log('  - registro_diario:', registroDiario.length, 'filas');
    console.log('  - historico_precios:', historico.length, 'filas');

    // PASO 1: Obtener todos los productos únicos del historial
    const productosUnicos = obtenerProductosUnicos(registroDiario, historico);
    console.log('📦 Productos únicos encontrados:', productosUnicos.size);

    // PASO 2: Procesar recordatorios manuales
    const recordatoriosManuales = new Map<string, { dias: number; notas: string }>();

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
          recordatoriosManuales.set(producto.toLowerCase(), { dias, notas });
        }
      }
    }

    console.log('📝 Recordatorios manuales:', recordatoriosManuales.size);

    // PASO 3: Generar recordatorios para todos los productos
    const recordatorios: any[] = [];

    for (const producto of productosUnicos) {
      const productoLower = producto.toLowerCase();

      // Buscar última compra
      const ultimaCompra = buscarUltimaCompra(producto, registroDiario, historico);

      let diasTranscurridos: number | null = null;
      let ultimaCompraStr: string | null = null;
      let tiendaUltimaCompra: string | null = null;
      let precioUltimaCompra: number | null = null;
      let diasConfigurados: number;
      let tipo: 'manual' | 'automatico';
      let notas = '';

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

      recordatorios.push({
        producto,
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

    console.log('✅ Recordatorios procesados:', recordatorios.length);

    // PASO 4: Ordenar por urgencia
    recordatorios.sort((a, b) => {
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
      porEstado: {
        vencido: recordatorios.filter(r => r.estado === 'vencido').length,
        proximo: recordatorios.filter(r => r.estado === 'proximo').length,
        ok: recordatorios.filter(r => r.estado === 'ok').length,
        sin_datos: recordatorios.filter(r => r.estado === 'sin_datos').length,
      },
    };

    return NextResponse.json({
      success: true,
      data: recordatorios,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error en GET /api/recordatorios:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener recordatorios',
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
    const { producto, dias, notas = '' } = body;

    // Validaciones
    if (!producto || typeof producto !== 'string' || producto.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El producto debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    const diasNum = parseInt(dias);
    if (!diasNum || diasNum < 1 || diasNum > 90) {
      return NextResponse.json(
        { success: false, error: 'Los días deben estar entre 1 y 90' },
        { status: 400 }
      );
    }

    // Verificar duplicados
    const sheetsData = await getAllSheetsData();
    const recordatoriosRaw = sheetsData.recordatorios;
    const productoLower = producto.trim().toLowerCase();

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
    if (N8N_RECORDATORIOS_WEBHOOK) {
      console.log('📤 Enviando a n8n:', {
        action: 'append',
        sheet: HOJA_RECORDATORIOS,
        row: [producto.trim(), diasNum.toString(), 'TRUE', String(notas).trim()],
      });

      const response = await fetch(N8N_RECORDATORIOS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'append',
          sheet: HOJA_RECORDATORIOS,
          row: [producto.trim(), diasNum.toString(), 'TRUE', String(notas).trim()],
        }),
      });

      console.log('📡 Respuesta n8n status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ n8n append falló:', text);
        return NextResponse.json(
          { success: false, error: 'Error al guardar en n8n. Verifica que el webhook esté configurado correctamente.' },
          { status: 500 }
        );
      }

      const result = await response.json();
      console.log('✅ n8n append éxito:', result);

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
        producto: producto.trim(),
        dias: diasNum,
        notas: String(notas).trim(),
      },
    });
  } catch (error: any) {
    console.error('❌ Error en POST /api/recordatorios:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear recordatorio',
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
    const { producto } = body;

    console.log('🗑️ DELETE /api/recordatorios');
    console.log('  Body recibido:', body);
    console.log('  Producto a eliminar:', producto);

    if (!producto || typeof producto !== 'string') {
      console.error('❌ Producto no especificado o invalido');
      return NextResponse.json(
        { success: false, error: 'Producto no especificado' },
        { status: 400 }
      );
    }

    // Intentar eliminar vía n8n
    if (N8N_RECORDATORIOS_WEBHOOK) {
      const payload = {
        action: 'delete',
        sheet: HOJA_RECORDATORIOS,
        producto: producto.trim(),
      };

      console.log('📤 Enviando a n8n DELETE:', payload);

      const response = await fetch(N8N_RECORDATORIOS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📡 Respuesta n8n status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ n8n delete falló (status ' + response.status + '):', text);
        return NextResponse.json(
          { success: false, error: 'Error al eliminar en n8n. Status: ' + response.status },
          { status: response.status }
        );
      }

      const result = await response.json();
      console.log('✅ n8n delete resultado:', result);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Error al eliminar' },
          { status: 500 }
        );
      }
    } else {
      console.error('❌ N8N_RECORDATORIOS_WEBHOOK no configurado');
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
  } catch (error: any) {
    console.error('❌ Error en DELETE /api/recordatorios:', error);
    console.error('  Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar recordatorio',
      },
      { status: 500 }
    );
  }
}
