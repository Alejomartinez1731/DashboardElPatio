import { NextResponse } from 'next/server';
import { verifyPassword, createSession } from '@/lib/auth';
import { generalLogger } from '@/lib/logger';
import { loginSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Verificar contraseña
    const isValid = verifyPassword(password);

    if (!isValid) {
      generalLogger.debug('❌ Login fallido: contraseña incorrecta');
      return NextResponse.json(
        { success: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear sesión
    generalLogger.debug('✅ Login exitoso, creando sesión...');
    await createSession();
    generalLogger.debug('✅ Sesión creada correctamente');

    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
    });

    // Debug: Log headers de respuesta
    generalLogger.debug('📝 Response headers:', response.headers);

    return response;
  } catch (error) {
    generalLogger.error('❌ Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
