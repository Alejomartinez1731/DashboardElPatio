import { NextResponse } from 'next/server';
import { requireSupabase } from '@/lib/supabase';
import { apiLogger } from '@/lib/logger';
import { normalizarTienda } from '@/lib/data-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET - Obtiene todas las tiendas únicas
 */
export async function GET() {
  const supabase = requireSupabase();
  try {
    apiLogger.info('📡 GET /api/tiendas');

    // Obtener todas las compras (solo necesitamos el campo tienda)
    const { data, error } = await supabase
      .from('compras')
      .select('tienda');

    if (error) {
      apiLogger.error('Error obteniendo tiendas:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener tiendas',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Extraer y normalizar tiendas únicas
    const tiendasUnicasSet = new Set<string>();
    (data || []).forEach((compra: any) => {
      if (compra.tienda) {
        const tiendaNormalizada = normalizarTienda(compra.tienda);
        tiendasUnicasSet.add(tiendaNormalizada);
      }
    });

    // Convertir a array y ordenar alfabéticamente
    const tiendasUnicas = Array.from(tiendasUnicasSet).sort();

    apiLogger.info('✅ Tiendas únicas obtenidas:', {
      count: tiendasUnicas.length,
      tiendas: tiendasUnicas,
    });

    return NextResponse.json({
      success: true,
      data: tiendasUnicas,
      timestamp: new Date().toISOString(),
      _source: 'supabase',
    });
  } catch (error) {
    const err = error as Error;
    apiLogger.error('❌ Error en GET /api/tiendas:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error al obtener tiendas',
      },
      { status: 500 }
    );
  }
}
