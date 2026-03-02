import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración de n8n
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
const N8N_RECORDATORIOS_WEBHOOK = process.env.N8N_RECORDATORIOS_WEBHOOK_URL; // Nuevo webhook para escritura (DEBE terminar en _URL)

// Spreadhseet ID para lectura directa
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

// Nombres de las hojas
const HOJA_RECORDATORIOS = 'Recordatorios';
const HOJA_REGISTRO_DIARIO = 'Registro Diario';
const HOJA_HISTORICO_PRECIOS = 'Histórico de Precios';

/**
 * Obtiene los datos de una hoja específica de Google Sheets
 */
async function getSheetData(sheetName: string): Promise<string[][]> {
  // Prioridad 1: Usar n8n si está configurado
  if (N8N_WEBHOOK_URL) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        // Mapear nombres de n8n
        const hojaMap: Record<string, string> = {
          [HOJA_RECORDATORIOS]: 'recordatorios',
          [HOJA_REGISTRO_DIARIO]: 'registro_diario',
          [HOJA_HISTORICO_PRECIOS]: 'historico_precios',
        };

        const key = hojaMap[sheetName] || sheetName.toLowerCase().replace(/ /g, '_');
        const sheetData = data.data?.[key];

        if (sheetData?.values && Array.isArray(sheetData.values)) {
          return sheetData.values;
        }
      }
    } catch (error) {
      console.warn('⚠️ n8n falló para lectura, intentando API directa');
    }
  }

  // Prioridad 2: Usar Google Sheets API directo
  if (!SPREADSHEET_ID || !API_KEY) {
    console.warn('⚠️ No hay credenciales de Google Sheets configuradas');
    return [];
  }

  try {
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });

    return response.data.values || [];
  } catch (error: any) {
    if (error.code === 404) {
      console.warn(`⚠️ Hoja "${sheetName}" no encontrada`);
    } else {
      console.error(`❌ Error leyendo hoja "${sheetName}":`, error.message);
    }
    return [];
  }
}

/**
 * Escribe una fila usando n8n
 */
async function appendRowN8N(producto: string, dias: number, notas: string): Promise<boolean> {
  console.log('📡 appendRowN8N llamado con URL:', N8N_RECORDATORIOS_WEBHOOK);

  if (!N8N_RECORDATORIOS_WEBHOOK) {
    console.error('❌ N8N_RECORDATORIOS_WEBHOOK_URL no está configurado');
    console.error('Variables disponibles:', Object.keys(process.env).filter(k => k.includes('N8N')));
    return false;
  }

  try {
    const payload = {
      action: 'append',
      sheet: HOJA_RECORDATORIOS,
      row: [producto, dias.toString(), 'TRUE', notas],
    };

    console.log('📤 Enviando a n8n:', payload);

    const response = await fetch(N8N_RECORDATORIOS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('📡 Respuesta n8n status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ n8n append falló:', text);
      return false;
    }

    const result = await response.json();
    console.log('✅ n8n append éxito:', result);
    return result.success === true;
  } catch (error: any) {
    console.error('❌ Error appendRowN8N:', error.message);
    return false;
  }
}

/**
 * Elimina una fila usando n8n
 */
async function deleteRowN8N(producto: string): Promise<boolean> {
  if (!N8N_RECORDATORIOS_WEBHOOK) {
    console.warn('⚠️ N8N_RECORDATORIOS_WEBHOOK_URL no configurado');
    return false;
  }

  try {
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
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error: any) {
    console.error('❌ Error deleteRowN8N:', error.message);
    return false;
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

    // Obtener datos de las hojas
    const [recordatoriosRaw, registroDiario, historico] = await Promise.all([
      getSheetData(HOJA_RECORDATORIOS),
      getSheetData(HOJA_REGISTRO_DIARIO),
      getSheetData(HOJA_HISTORICO_PRECIOS),
    ]);

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

    return NextResponse.json({
      success: true,
      data: recordatorios,
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
    const recordatoriosRaw = await getSheetData(HOJA_RECORDATORIOS);
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
      const exito = await appendRowN8N(producto.trim(), diasNum, String(notas).trim());

      if (!exito) {
        return NextResponse.json(
          { success: false, error: 'Error al guardar en n8n. Verifica que el webhook esté configurado correctamente.' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay webhook de n8n configurado para guardar recordatorios. Configura N8N_RECORDATORIOS_WEBHOOK_URL en .env.local',
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

    // Verificar que existe
    const recordatoriosRaw = await getSheetData(HOJA_RECORDATORIOS);
    const productoLower = producto.trim().toLowerCase();
    let found = false;

    if (recordatoriosRaw.length > 1) {
      for (let i = 1; i < recordatoriosRaw.length; i++) {
        const fila = recordatoriosRaw[i];
        if (fila.length > 0) {
          const productoExistente = String(fila[0] || '').trim().toLowerCase();

          if (productoExistente === productoLower) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      return NextResponse.json(
        { success: false, error: `No se encontró recordatorio para "${producto}"` },
        { status: 404 }
      );
    }

    // Intentar eliminar vía n8n
    if (N8N_RECORDATORIOS_WEBHOOK) {
      const exito = await deleteRowN8N(producto.trim());

      if (!exito) {
        return NextResponse.json(
          { success: false, error: 'Error al eliminar en n8n. Verifica que el webhook esté configurado correctamente.' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'No hay webhook de n8n configurado para eliminar recordatorios. Configura N8N_RECORDATORIOS_WEBHOOK_URL en .env.local',
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
