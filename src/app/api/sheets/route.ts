import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function GET(request: Request) {
  // Si USE_MOCK=true, redirigir al endpoint mock
  if (USE_MOCK) {
    const { GET } = await import('./mock/route');
    return GET(request);
  }
  try {
    console.log('📡 API /api/sheets llamada');

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    console.log('📡 Webhook URL:', webhookUrl ? `${webhookUrl.substring(0, 30)}...` : 'NOT_SET');

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_N8N_WEBHOOK_URL no está configurada en Vercel',
        hint: 'Ve a Settings → Environment Variables en Vercel y agrega la variable',
      }, { status: 500 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(webhookUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Edge-Function',
      },
    });
    clearTimeout(timeoutId);

    console.log('📡 Respuesta n8n status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      throw new Error(`n8n respondió con status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📡 Datos recibidos:', Object.keys(data.data || {}));

    // Mapear nombres de n8n a nombres internos del dashboard
    // n8n usa nombres como 'producto_mas_costoso', 'gasto_por_tienda', etc.
    const mappedData = {
      base_de_datos: data.data.base_de_datos || data.data.historico || {},
      historico: data.data.historico || {},
      historico_precios: data.data.historico_precios || {},
      costosos: data.data.producto_mas_costoso || data.data.costosos || {},
      gasto_tienda: data.data.gasto_por_tienda || data.data.gasto_tienda || {},
      precio_producto: data.data.precio_por_producto || data.data.precio_producto || {},
      registro_diario: data.data.registro_diario || {},
    };

    return NextResponse.json({
      success: true,
      data: mappedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
