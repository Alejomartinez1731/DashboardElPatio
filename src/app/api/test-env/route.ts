import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const envVars = {
    NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'NOT_SET',
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'NOT_SET',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('N8N') || k.includes('WEBHOOK')),
  };

  return NextResponse.json({
    success: true,
    env: envVars,
    nodeEnv: process.env.NODE_ENV,
  });
}
