import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware para proteger las rutas del dashboard
 *
 * ⚠️ AUTENTICACIÓN DESACTIVADA
 * El dashboard ahora es de acceso público sin contraseña.
 *
 * Para reactivar la autenticación, descomentar el código de abajo
 * y agregar de nuevo: import { isAuthenticatedFromRequest } from '@/lib/auth';
 */
export function middleware(request: NextRequest) {
  // Autenticación desactivada - permitir acceso a todas las rutas
  return NextResponse.next();

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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
