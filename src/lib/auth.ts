import { cookies } from 'next/headers';

/**
 * Contraseña del dashboard (configurada por variable de entorno)
 * En producción debe estar configurada en Vercel
 */
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';

/**
 * Nombre de la cookie de sesión
 */
const SESSION_COOKIE_NAME = 'dashboard_session';

/**
 * Duración de la sesión en milisegundos (24 horas)
 */
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return false;
  }

  try {
    // La cookie contiene un timestamp de expiración
    const sessionData = JSON.parse(sessionCookie.value);
    const now = Date.now();

    // Verificar si la sesión aún es válida
    return sessionData.expiresAt > now;
  } catch {
    // Si la cookie está corrupta, considerar como no autenticado
    return false;
  }
}

/**
 * Verifica si una contraseña es correcta
 */
export function verifyPassword(password: string): boolean {
  return password === DASHBOARD_PASSWORD;
}

/**
 * Crea una sesión de usuario
 */
export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_DURATION;

  const sessionData = {
    expiresAt,
    createdAt: Date.now(),
  };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // En segundos
    path: '/',
  });
}

/**
 * Elimina la sesión del usuario (logout)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Obtiene el tiempo restante de la sesión en minutos
 */
export async function getSessionTimeRemaining(): Promise<number> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return 0;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value);
    const remaining = sessionData.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // Minutos restantes
  } catch {
    return 0;
  }
}
