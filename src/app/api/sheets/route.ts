import { NextResponse } from 'next/server';
import { getN8NData, getN8NSheetData } from '@/lib/n8n';

// Configurar revalidación de 5 minutos (los datos se actualizan por la tarde)
export const revalidate = 300;

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * API Route que obtiene todas las hojas de Google Sheets a través de n8n
 *
 * n8n se conecta a Google Sheets usando OAuth2 y devuelve los datos ya procesados
 *
 * Query params:
 * - sheet: nombre específico de hoja (opcional, si se omite devuelve todas)
 *
 * Ejemplos:
 * GET /api/sheets → devuelve todas las hojas
 * GET /api/sheets?sheet=historico_precios → devuelve solo esa hoja
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet') as any;

    // Si se solicita una hoja específica
    if (sheetName) {
      const data = await getN8NSheetData(sheetName);

      return NextResponse.json({
        success: true,
        sheet: sheetName,
        data,
        timestamp: new Date().toISOString(),
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Por defecto, devolver todas las hojas
    const allSheetsData = await getN8NData();

    return NextResponse.json({
      success: true,
      data: allSheetsData,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error en API route /api/sheets:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sheets data',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
