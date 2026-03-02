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

    const data = await response.json();
    console.log('✅ n8n respondió, claves:', Object.keys(data.data || {}));
    console.log('📦 Estructura de data.data:', JSON.stringify(data.data, null, 2).substring(0, 500));

    return {
      recordatorios: data.data?.recordatorios?.values || [],
      registro_diario: data.data?.registro_diario?.values || [],
      historico_precios: data.data?.historico_precios?.values || [],
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
 * Calcula el estado de un recordatorio
 */
function calcularEstado(diasTranscurridos: number | null, diasConfigurados: number): string {
  if (diasTranscurridos === null) return 'sin_datos';
  if (diasTranscurridos >= diasConfigurados) return 'vencido';
  if (diasTranscurridos >= diasConfigurados * 0.7) return 'proximo';
  return 'ok';
}

/**
 * GET - Obtiene todos los recordatorios con su estado actualizado
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

    if (recordatoriosRaw.length > 0) {
      console.log('  - Primera fila recordatorios:', recordatoriosRaw[0]);
    }

    // Procesar recordatorios
    const recordatorios: any[] = [];

    if (recordatoriosRaw.length > 1) {
      for (let i = 1; i < recordatoriosRaw.length; i++) {
        const fila = recordatoriosRaw[i];
        if (fila.length < 2) continue;

        const producto = String(fila[0] || '').trim();
        const dias = parseInt(String(fila[1] || '0')) || 0;
        const activo = String(fila[2] || 'TRUE').toUpperCase() === 'TRUE';
        const notas = String(fila[3] || '');

        console.log(`📝 Procesando fila ${i}:`, { producto, dias, activo, notas });

        if (!producto || !activo || dias <= 0) continue;

        // Buscar última compra
        const ultimaCompra = buscarUltimaCompra(producto, registroDiario, historico);

        let diasTranscurridos: number | null = null;
        let ultimaCompraStr: string | null = null;
        let tiendaUltimaCompra: string | null = null;
        let precioUltimaCompra: number | null = null;

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

        recordatorios.push({
          producto,
          diasConfigurados: dias,
          ultimaCompra: ultimaCompraStr,
          diasTranscurridos,
          estado: calcularEstado(diasTranscurridos, dias),
          tiendaUltimaCompra,
          precioUltimaCompra,
          notas,
        });
      }
    }

    console.log('✅ Recordatorios procesados:', recordatorios.length);

    // Ordenar por urgencia
    recordatorios.sort((a, b) => {
      const orden = { vencido: 0, proximo: 1, sin_datos: 2, ok: 3 };
      const ordenA = orden[a.estado as keyof typeof orden];
      const ordenB = orden[b.estado as keyof typeof orden];

      if (ordenA !== ordenB) return ordenA - ordenB;

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
      n8nKeys: Object.keys(sheetsData),
      recordatoriosRaw: recordatoriosRaw.length,
      primeraFila: recordatoriosRaw[0] || null,
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

    if (!producto || typeof producto !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Producto no especificado' },
        { status: 400 }
      );
    }

    // Intentar eliminar vía n8n
    if (N8N_RECORDATORIOS_WEBHOOK) {
      const response = await fetch(N8N_RECORDATORIOS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          sheet: HOJA_RECORDATORIOS,
          producto,
        }),
      });

      if (!response.ok) {
        console.error('❌ n8n delete falló:', await response.text());
        return NextResponse.json(
          { success: false, error: 'Error al eliminar en n8n. Verifica que el webhook esté configurado correctamente.' },
          { status: 500 }
        );
      }

      const result = await response.json();

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Error al eliminar' },
          { status: 500 }
        );
      }
    } else {
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
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar recordatorio',
      },
      { status: 500 }
    );
  }
}
