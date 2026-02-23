import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Usar MOCK solo si está explícitamente configurado
// Por defecto, intenta conectar a n8n
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

export async function GET(request: Request) {
  // Si USE_MOCK=true, usar datos mock directamente (sin intentar n8n)
  if (USE_MOCK) {
    console.log('📭 Usando MODO MOCK explícito (USE_MOCK_DATA=true)');
    const { GET } = await import('./mock/route');
    return GET(request);
  }

  try {
    console.log('📡 API /api/sheets llamada');

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    console.log('📡 Webhook URL:', webhookUrl ? `${webhookUrl.substring(0, 30)}...` : 'NOT_SET');

    if (!webhookUrl) {
      console.warn('⚠️ NEXT_PUBLIC_N8N_WEBHOOK_URL no configurada, usando MOCK');
      const { GET } = await import('./mock/route');
      return GET(request);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(webhookUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Function',
      },
    });
    clearTimeout(timeoutId);

    console.log('📡 Respuesta n8n status:', response.status);

    if (!response.ok) {
      console.warn(`⚠️ n8n falló con status ${response.status}, usando MOCK como fallback`);
      const { GET } = await import('./mock/route');
      return GET(request);
    }

    const data = await response.json();
    console.log('📡 Datos recibidos de n8n:', Object.keys(data.data || {}));

    // Mapear nombres de n8n a nombres internos del dashboard
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
      _source: 'n8n',
    });
  } catch (error) {
    console.error('❌ Error fetching n8n, usando MOCK como fallback:', error);
    const { GET } = await import('./mock/route');
    return GET(request);
  }
}
