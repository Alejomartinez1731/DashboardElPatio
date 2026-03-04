/**
 * Rate Limiting - Limita peticiones para prevenir abuso
 *
 * Soporta dos modos:
 * - Desarrollo: In-memory (sin Redis)
 * - Producción: Redis con Upstash
 */

// @ts-ignore - Upstash packages from GitHub may not have types
import { Ratelimit } from '@upstash/ratelimit';
// @ts-ignore - Upstash packages from GitHub may not have types
import { Redis } from '@upstash/redis';

// Tipo para resultado de rate limiting
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

// Configuración de límites según el endpoint
export interface RateLimitConfig {
  limit: number;      // Máximo de peticiones
  window: number;     // Ventana de tiempo en segundos
  prefix: string;     // Prefijo para la clave en Redis
}

// Configuraciones predefinidas
export const RATE_LIMITS = {
  // Auth endpoints: 5 intentos cada 5 minutos
  auth: {
    limit: 5,
    window: 300, // 5 minutos
    prefix: 'ratelimit:auth',
  },
  // Data endpoints: 60 peticiones por minuto
  api: {
    limit: 60,
    window: 60, // 1 minuto
    prefix: 'ratelimit:api',
  },
  // Recordatorios: 30 peticiones por minuto
  recordatorios: {
    limit: 30,
    window: 60,
    prefix: 'ratelimit:recordatorios',
  },
} as const;

/**
 * Crea un rate limiter basado en el entorno
 */
function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  // Verificar si hay configuración de Redis
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    // Producción: Usar Upstash Redis
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
      analytics: true,
      prefix: config.prefix,
    });
  }

  // Desarrollo: No usar Redis (rate limiting deshabilitado)
  // En desarrollo, queremos permitir peticiones ilimitadas para facilitar testing
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚠️ Rate limiting deshabilitado en desarrollo para: ${config.prefix}`);
    return null;
  }

  // Producción sin Redis: Usar rate limiting en memoria
  // NOTA: Esto no escala en múltiples instancias, pero es mejor que nada
  console.warn(`⚠️ Producción sin Redis detectada. Rate limiting en memoria para: ${config.prefix}`);

  return null; // Podríamos implementar en memoria aquí si fuera necesario
}

/**
 * Rate limiters cache (creados bajo demanda)
 */
const limitersCache = new Map<keyof typeof RATE_LIMITS, Ratelimit | null>();

/**
 * Obtiene o crea un rate limiter para una configuración específica
 */
function getRateLimiter(key: keyof typeof RATE_LIMITS): Ratelimit | null {
  if (!limitersCache.has(key)) {
    const config = RATE_LIMITS[key];
    const limiter = createRateLimiter(config);
    limitersCache.set(key, limiter);
  }
  return limitersCache.get(key) || null;
}

/**
 * Verifica rate limiting para una petición
 *
 * @param key - Tipo de rate limit (auth, api, recordatorios)
 * @param identifier - Identificador único (IP, session ID, etc.)
 * @returns Resultado del rate limiting
 */
export async function checkRateLimit(
  key: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(key);
  const config = RATE_LIMITS[key];

  // Si no hay rate limiter (desarrollo), permitir todo
  if (!limiter) {
    return {
      success: true,
      remaining: config.limit,
      reset: Date.now() + config.window * 1000,
      limit: config.limit,
    };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: config.limit,
    };
  } catch (error) {
    console.error('Error en rate limiting:', error);
    // En caso de error, permitir la petición (fail open)
    return {
      success: true,
      remaining: config.limit,
      reset: Date.now() + config.window * 1000,
      limit: config.limit,
    };
  }
}

/**
 * Obtiene la dirección IP del cliente desde una request Next.js
 */
export function getClientIP(request: Request): string {
  // Headers comunes donde puede estar la IP real
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const realIP = headers.get('x-real-ip');
  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for puede tener múltiples IPs: "client, proxy1, proxy2"
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0] || 'unknown';
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback: host remoto (no disponible en Next.js Edge/Serverless)
  return 'unknown';
}

/**
 * Genera headers de rate limiting para la respuesta
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}

/**
 * Wrapper para API routes con rate limiting
 *
 * Uso:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimit = await withRateLimit('auth', request);
 *   if (!rateLimit.success) {
 *     return NextResponse.json(
 *       { error: 'Demasiados intentos. Espera 5 minutos.' },
 *       { status: 429, headers: getRateLimitHeaders(rateLimit) }
 *     );
 *   }
 *   // ... resto del handler
 * }
 * ```
 */
export async function withRateLimit(
  key: keyof typeof RATE_LIMITS,
  request: Request
): Promise<RateLimitResult> {
  const identifier = getClientIP(request);
  return checkRateLimit(key, identifier);
}
