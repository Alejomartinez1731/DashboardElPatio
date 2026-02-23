import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

  const results = {
    env: {
      NEXT_PUBLIC_N8N_WEBHOOK_URL: webhookUrl ? `${webhookUrl.substring(0, 20)}...` : 'NOT_SET',
      GOOGLE_SHEETS_SPREADSHEET_ID: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID || 'NOT_SET',
    },
    webhookTest: {
      url: webhookUrl ? 'CONFIGURED' : 'NOT_SET',
      status: 'NOT_TESTED',
      error: null as string | null,
      keys: [] as string[],
      sampleKeys: [] as string[],
    }
  };

  // Test webhook connection
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhookUrl, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeoutId);

      results.webhookTest.status = `HTTP ${response.status}`;

      if (response.ok) {
        const data = await response.json();
        results.webhookTest.keys = Object.keys(data.data || data || {});
        results.webhookTest.sampleKeys = results.webhookTest.keys.slice(0, 5);
      } else {
        const errorText = await response.text().catch(() => 'No error body');
        results.webhookTest.error = `Status ${response.status}: ${errorText}`;
      }
    } catch (error) {
      results.webhookTest.status = 'FAILED';
      results.webhookTest.error = error instanceof Error ? error.message : String(error);
    }
  }

  // CORS headers para poder acceder desde navegador
  return NextResponse.json(results, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
