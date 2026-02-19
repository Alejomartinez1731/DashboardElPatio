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

    return NextResponse.json({
      success: true,
      data: data.data,
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
