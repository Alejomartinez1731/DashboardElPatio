/**
 * Sistema de caché simple para respuestas de API
 * Usa localStorage con TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export class ApiCache {
  private prefix = 'elpatio_cache_';

  /**
   * Genera clave de caché
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Guarda datos en caché
   */
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    if (typeof window === 'undefined') return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000, // Convertir a ms
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn('Error guardando en caché:', error);
    }
  }

  /**
   * Obtiene datos de caché si no han expirado
   */
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();
      const age = now - entry.timestamp;

      // Verificar si expiró
      if (age > entry.ttl) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Error leyendo caché:', error);
      return null;
    }
  }

  /**
   * Limpia una entrada específica
   */
  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(key));
  }

  /**
   * Limpia toda la caché
   */
  clear(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Verifica si una entrada existe y no ha expirado
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Instancia global
export const apiCache = new ApiCache();

/**
 * Wrapper para fetch con caché
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes: number = 5
): Promise<T> {
  // Verificar caché primero
  const cached = apiCache.get<T>(key);
  if (cached) {
    console.log(`[Cache HIT] ${key}`);
    return cached;
  }

  console.log(`[Cache MISS] ${key}`);
  const data = await fetcher();

  // Guardar en caché
  apiCache.set(key, data, ttlMinutes);

  return data;
}
