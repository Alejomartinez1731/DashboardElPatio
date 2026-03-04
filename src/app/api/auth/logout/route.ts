import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { generalLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Destruir sesión
    await destroySession();

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada',
    });
  } catch (error) {
    generalLogger.error('Error en logout:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
