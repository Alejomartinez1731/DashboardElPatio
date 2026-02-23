import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticatedFromRequest } from '@/lib/auth';

/**
 * Middleware para proteger las rutas del dashboard
 *
 * Rutas públicas:
 * - /login
 * - /api/* (API routes)
 *
 * Rutas protegidas:
 * - / (redirige a /dashboard)
 * - /dashboard
 * - /registro
 * - /precios
 * - /proveedores
 * - /facturas
 * - /diagnostico
 */
export function middleware(request: NextRequest) {
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
  // console.log(`🔐 Middleware: ${pathname} | Auth: ${authenticated}`);

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
