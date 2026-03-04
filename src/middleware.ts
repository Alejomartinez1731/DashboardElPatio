import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';

/**
 * Middleware para proteger las rutas del dashboard
 *
 * ⚠️ AUTENTICACIÓN DESACTIVADA
 * El dashboard ahora es de acceso público sin contraseña.
 *
 * Para reactivar la autenticación, descomentar el código de abajo
 * y agregar de nuevo: import { isAuthenticatedFromRequest } from '@/lib/auth';
 *
 * ✅ RATE LIMITING ACTIVADO
 * - Auth endpoints: 5 intentos cada 5 minutos
 * - API endpoints: 60 peticiones por minuto
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Aplicar rate limiting a endpoints de autenticación
  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    const rateLimit = await withRateLimit('auth', request);

    if (!rateLimit.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Demasiados intentos. Por favor espera 5 minutos antes de volver a intentar.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );

      // Agregar headers de rate limit
      response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());
      response.headers.set('Retry-After', Math.ceil((rateLimit.reset - Date.now()) / 1000).toString());

      return response;
    }

    // Rate limit exitoso, agregar headers informativos y continuar
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());

    return response;
  }

  // Aplicar rate limiting a otras APIs (menos estricto)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Usar límite general de API para todas las demás rutas
    const rateLimit = await withRateLimit('api', request);

    if (!rateLimit.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Demasiadas peticiones. Por favor reduce la frecuencia de solicitudes.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );

      response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());
      response.headers.set('Retry-After', Math.ceil((rateLimit.reset - Date.now()) / 1000).toString());

      return response;
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.reset).toISOString());

    return response;
  }

  // Autenticación desactivada - permitir acceso a todas las rutas
  const response = NextResponse.next();

  // Agregar headers de seguridad a todas las respuestas
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;

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
