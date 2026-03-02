import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuración de Google Sheets
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
  if (!SPREADSHEET_ID || !API_KEY) {
    console.warn('⚠️ No hay credenciales de Google Sheets configuradas');
    return [];
  }

  try {
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
 * Escribe una fila en una hoja de Google Sheets
 */
async function appendRow(sheetName: string, values: string[]): Promise<boolean> {
  if (!SPREADSHEET_ID || !API_KEY) {
    console.warn('⚠️ No hay credenciales de Google Sheets configuradas');
    return false;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return true;
  } catch (error: any) {
    console.error('❌ Error escribiendo en Google Sheets:', error.message);
    return false;
  }
}

/**
 * Elimina una fila de una hoja de Google Sheets
 */
async function deleteRow(sheetName: string, rowIndex: number): Promise<boolean> {
  if (!SPREADSHEET_ID || !API_KEY) {
    console.warn('⚠️ No hay credenciales de Google Sheets configuradas');
    return false;
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });

    // Primero obtener todas las filas
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });

    const values = response.data.values || [];
    if (rowIndex >= values.length) {
      return false;
    }

    // Crear nuevo array sin la fila a eliminar
    const newValues = values.filter((_, idx) => idx !== rowIndex);

    // Escribir todo el contenido de nuevo
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newValues,
      },
    });

    return true;
  } catch (error: any) {
    console.error('❌ Error eliminando fila de Google Sheets:', error.message);
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

    // Añadir nuevo recordatorio
    const exito = await appendRow(HOJA_RECORDATORIOS, [
      producto.trim(),
      diasNum.toString(),
      'TRUE',
      String(notas).trim(),
    ]);

    if (!exito) {
      return NextResponse.json(
        { success: false, error: 'Error al guardar en Google Sheets' },
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

    // Buscar y eliminar el recordatorio
    const recordatoriosRaw = await getSheetData(HOJA_RECORDATORIOS);
    const productoLower = producto.trim().toLowerCase();
    let found = false;

    if (recordatoriosRaw.length > 1) {
      for (let i = 1; i < recordatoriosRaw.length; i++) {
        const fila = recordatoriosRaw[i];
        if (fila.length > 0) {
          const productoExistente = String(fila[0] || '').trim().toLowerCase();

          if (productoExistente === productoLower) {
            const exito = await deleteRow(HOJA_RECORDATORIOS, i);
            if (!exito) {
              return NextResponse.json(
                { success: false, error: 'Error al eliminar de Google Sheets' },
                { status: 500 }
              );
            }
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
