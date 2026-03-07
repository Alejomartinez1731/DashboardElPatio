import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy para proteger las rutas del dashboard
 *
 * ⚠️ AUTENTICACIÓN DESACTIVADA
 * El dashboard ahora es de acceso público sin contraseña.
 *
 * ⚠️ RATE LIMITING DESHABILIDO TEMPORALMENTE
 * Deshabilitado para evitar errores en deployment
 *
 * ✅ HEADERS DE SEGURIDAD ACTIVADOS
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting deshabilitado temporalmente
  // TODO: Re-habilitar después de diagnosticar errores de deployment

  // Crear respuesta base
  const response = NextResponse.next();

  // Agregar headers de seguridad a todas las respuestas
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;

  /* === CÓDIGO DE RATE LIMITING (DESACTIVADO TEMPORALMENTE) ===
  // NOTa: Re-habilitar después de diagnosticar errores de Vercel

  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    const rateLimit = await withRateLimit('auth', request);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Espera 5 minutos.' },
        { status: 429 }
      );
    }
  }

  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const rateLimit = await withRateLimit('api', request);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas peticiones.' },
        { status: 429 }
      );
    }
  }
  === FIN CÓDIGO DE RATE LIMITING === */

  /* === CÓDIGO DE AUTENTICACIÓN (DESACTIVADO) ===
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.ico') ||
    pathname.includes('.jpg') ||
    pathname.includes('.png') ||
    pathname.includes('.svg') ||
    pathname.includes('.woff');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Verificar autenticación (versión síncrona para middleware)
  const authenticated = isAuthenticatedFromRequest(request);

  // Debug: Log autenticación (comentar en producción)
  // generalLogger.debug(`🔐 Middleware: ${pathname} | Auth: ${authenticated}`);

  if (!authenticated) {
    // Redirigir al login si no está autenticado
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si está autenticado y trata de acceder a /login, redirigir al dashboard
  if (pathname === '/login' && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
  === FIN CÓDIGO DE AUTENTICACIÓN === */
}

/**
 * Configuración del middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
