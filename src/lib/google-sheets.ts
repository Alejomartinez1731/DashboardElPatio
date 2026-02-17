import { google } from 'googleapis';
import type { SheetData, SheetName } from '@/types';

// IDs de las hojas de Google Sheets
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

// Mapeo de nombres de hojas según los requisitos
const SHEET_NAMES: Record<SheetName, string> = {
  'historico': 'Historico',
  'historico_precios': 'Histórico de Precios',
  'costosos': 'Producto más costoso',
  'gasto_tienda': 'Gasto Por Tienda',
  'precio_producto': 'Precio x Producto',
  'registro_diario': 'Registro Diario',
};

/**
 * Obtiene datos de una hoja específica de Google Sheets
 */
export async function getSheetData(sheetName: SheetName, range?: string): Promise<SheetData> {
  if (!SPREADSHEET_ID || !API_KEY) {
    throw new Error('Faltan variables de entorno de Google Sheets');
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: API_KEY });
    const nombreHoja = SHEET_NAMES[sheetName];

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range || `'${nombreHoja}'!A1:Z`,
    });

    return {
      range: response.data.range || '',
      values: response.data.values || [],
    };
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    throw new Error(`Failed to fetch data from ${sheetName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Obtiene todas las hojas de datos en paralelo
 */
export async function getAllSheetsData(): Promise<Record<SheetName, SheetData>> {
  const sheetNames: SheetName[] = ['historico', 'historico_precios', 'costosos', 'gasto_tienda', 'precio_producto', 'registro_diario'];

  const results = await Promise.allSettled(
    sheetNames.map(async (name): Promise<{ name: SheetName; data: SheetData; success: boolean }> => {
      try {
        const data = await getSheetData(name);
        return { name, data, success: true };
      } catch (error) {
        console.error(`Failed to load ${name}:`, error);
        return { name, data: { range: '', values: [] }, success: false };
      }
    })
  );

  const allData: Partial<Record<SheetName, SheetData>> = {};

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allData[result.value.name] = result.value.data;
    }
  });

  return allData as Record<SheetName, SheetData>;
}

/**
 * Convierte los valores de una hoja en un array de objetos
 * Asume que la primera fila contiene los encabezados
 */
export function sheetValuesToArray<T extends Record<string, any>>(values: string[][]): T[] {
  if (!values || values.length === 0) {
    return [];
  }

  const headers = values[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  const rows = values.slice(1);

  return rows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}
