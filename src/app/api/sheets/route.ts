import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('📡 API /api/sheets llamada');

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    console.log('📡 Webhook URL:', webhookUrl);

    if (!webhookUrl) {
      throw new Error('NEXT_PUBLIC_N8N_WEBHOOK_URL no está configurada');
    }

    const response = await fetch(webhookUrl);
    console.log('📡 Respuesta n8n status:', response.status);

    if (!response.ok) {
      throw new Error(`n8n respondió con status ${response.status}`);
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
