/**
 * Utilidades de validación para API endpoints
 * Sanitiza y valida inputs de usuario para prevenir ataques
 */

import DOMPurify from 'dompurify';

/**
 * Opciones de validación
 */
export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valida un string según las opciones
 */
export function validateString(value: unknown, options: ValidationOptions = {}): ValidationResult {
  const errors: string[] = [];

  // Verificar tipo
  if (typeof value !== 'string') {
    return { valid: false, errors: ['Debe ser texto'] };
  }

  // Trim
  const trimmed = value.trim();

  // Required
  if (options.required && !trimmed) {
    errors.push('Este campo es requerido');
  }

  // Min length
  if (options.minLength && trimmed.length < options.minLength) {
    errors.push(`Debe tener al menos ${options.minLength} caracteres`);
  }

  // Max length
  if (options.maxLength && trimmed.length > options.maxLength) {
    errors.push(`Debe tener máximo ${options.maxLength} caracteres`);
  }

  // Pattern
  if (options.pattern && !options.pattern.test(trimmed)) {
    errors.push('Formato inválido');
  }

  // Enum
  if (options.enum && !options.enum.includes(trimmed)) {
    errors.push(`Debe ser uno de: ${options.enum.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida un número según las opciones
 */
export function validateNumber(value: unknown, options: ValidationOptions = {}): ValidationResult {
  const errors: string[] = [];

  const num = Number(value);

  // Verificar que es número
  if (isNaN(num)) {
    return { valid: false, errors: ['Debe ser un número'] };
  }

  // Min
  if (options.min !== undefined && num < options.min) {
    errors.push(`Debe ser al menos ${options.min}`);
  }

  // Max
  if (options.max !== undefined && num > options.max) {
    errors.push(`Debe ser máximo ${options.max}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida un objeto completo usando un schema
 */
export function validateObject(data: Record<string, unknown>, schema: Record<string, ValidationOptions>): ValidationResult {
  const errors: string[] = [];

  for (const [field, options] of Object.entries(schema)) {
    const value = data[field];

    // Si está ausente
    if (value === undefined || value === null) {
      if (options.required) {
        errors.push(`${field}: Es requerido`);
      }
      continue;
    }

    // Validar según tipo
    if (options.type === 'string') {
      const result = validateString(value, options);
      if (!result.valid) {
        errors.push(...result.errors.map(e => `${field}: ${e}`));
      }
    } else if (options.type === 'number') {
      const result = validateNumber(value, options);
      if (!result.valid) {
        errors.push(...result.errors.map(e => `${field}: ${e}`));
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitiza un string para prevenir inyección de código y XSS
 * Usa DOMPurify para una sanitización robusta de HTML
 */
export function sanitizeString(input: string, options?: { maxLength?: number; allowHTML?: boolean }): string {
  const maxLength = options?.maxLength || 1000;
  const allowHTML = options?.allowHTML || false;

  // Primero recortar longitud
  let trimmed = input.trim().substring(0, maxLength);

  if (allowHTML) {
    // Permitir HTML pero sanitizar con DOMPurify
    trimmed = DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: ['B', 'I', 'EM', 'STRONG', 'A', 'UL', 'OL', 'LI', 'BR', 'P'],
      ALLOWED_ATTR: ['href', 'title', 'target'],
      ALLOW_DATA_ATTR: false,
    });
  } else {
    // No permitir HTML, escapar todo
    trimmed = DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS: [], // No permitir ninguna etiqueta HTML
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
    });
  }

  return trimmed;
}

/**
 * Sanitiza un número
 */
export function sanitizeNumber(input: unknown): number | null {
  const num = Number(input);
  return isNaN(num) ? null : num;
}

/**
 * Sanitiza una URL para prevenir ataques de javascript:
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Solo permitir http/https
  const trimmed = url.trim();
  if (!trimmed.match(/^https?:\/\//i)) {
    return '';
  }

  // Sanitizar cualquier HTML que pueda contener
  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Valida y sanitiza nombre de producto
 */
export function validateProductoNombre(producto: unknown): { valid: boolean; sanitized: string | null; errors: string[] } {
  const errors: string[] = [];

  if (!producto || typeof producto !== 'string') {
    return {
      valid: false,
      sanitized: null,
      errors: ['El producto debe ser texto'],
    };
  }

  // Sanitizar con DOMPurify (no permitir HTML)
  const sanitized = sanitizeString(producto, { maxLength: 200, allowHTML: false });

  if (sanitized.length < 2) {
    errors.push('El producto debe tener al menos 2 caracteres');
  }

  return {
    valid: errors.length === 0,
    sanitized: sanitized.length > 0 ? sanitized : null,
    errors,
  };
}

/**
 * Valida y sanitiza días (para recordatorios)
 */
export function validateDias(dias: unknown): { valid: boolean; sanitized: number | null; errors: string[] } {
  const errors: string[] = [];

  const num = Number(dias);

  if (isNaN(num)) {
    return {
      valid: false,
      sanitized: null,
      errors: ['Los días deben ser un número'],
    };
  }

  if (num < 1 || num > 90) {
    errors.push('Los días deben estar entre 1 y 90');
  }

  return {
    valid: errors.length === 0,
    sanitized: num,
    errors,
  };
}

/**
 * Sanitiza un objeto completo recursivamente
 * Útil para sanitizar payloads JSON completos
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, options?: { maxLength?: number }): T {
  const sanitized = {} as Record<string, unknown>;

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
