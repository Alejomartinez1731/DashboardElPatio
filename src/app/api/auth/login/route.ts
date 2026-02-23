import { NextResponse } from 'next/server';
import { verifyPassword, createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Contraseña requerida' },
        { status: 400 }
      );
    }

    // Verificar contraseña
    const isValid = verifyPassword(password);

    if (!isValid) {
      console.log('❌ Login fallido: contraseña incorrecta');
      return NextResponse.json(
        { success: false, error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Crear sesión
    console.log('✅ Login exitoso, creando sesión...');
    await createSession();
    console.log('✅ Sesión creada correctamente');

    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
    });

    // Debug: Log headers de respuesta
    console.log('📝 Response headers:', response.headers);

    return response;
  } catch (error) {
    console.error('❌ Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
