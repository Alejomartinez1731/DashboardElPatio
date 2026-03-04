/**
 * Logger configurable para la aplicación
 * Deshabilita logs en producción para seguridad y rendimiento
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
type LogContext = 'api' | 'store' | 'component' | 'worker' | 'auth' | 'general';

interface LogConfig {
  level: LogLevel;
  enableInProduction: boolean;
}

// Configuración desde variables de entorno
const LOG_LEVEL = (process.env.NEXT_PUBLIC_LOG_LEVEL || 'info') as LogLevel;
const ENABLE_IN_PROD = process.env.NEXT_PUBLIC_LOG_IN_PROD === 'true';

const config: LogConfig = {
  level: LOG_LEVEL,
  enableInProduction: ENABLE_IN_PROD,
};

/**
 * Determina si el logging está habilitado
 */
function isLoggingEnabled(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: siempre habilitado en desarrollo
    return process.env.NODE_ENV === 'development';
  }
  // Client-side: respetar configuración
  return config.enableInProduction || process.env.NODE_ENV === 'development';
}

/**
 * Niveles de prioridad para logs
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * Logger principal
 */
class Logger {
  private context: LogContext;

  constructor(context: LogContext = 'general') {
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!isLoggingEnabled()) return false;
    if (config.level === 'none') return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = `[${this.context.toUpperCase()}]`;
    const levelStr = level.toUpperCase().padEnd(5);
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${contextStr} ${levelStr} ${message}${metaStr}`;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      generalLogger.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      generalLogger.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      generalLogger.error(this.formatMessage('error', message, meta));
    }
  }
}

/**
 * Instancias de logger por contexto
 */
export const apiLogger = new Logger('api');
export const storeLogger = new Logger('store');
export const componentLogger = new Logger('component');
export const authLogger = new Logger('auth');
export const generalLogger = new Logger('general');

/**
 * Shortcut functions para logging rápido
 */
export const log = {
  debug: (message: string, meta?: any) => generalLogger.debug(message, meta),
  info: (message: string, meta?: any) => generalLogger.info(message, meta),
  warn: (message: string, meta?: any) => generalLogger.warn(message, meta),
  error: (message: string, meta?: any) => generalLogger.error(message, meta),
};
