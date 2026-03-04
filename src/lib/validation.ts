/**
 * Utilidades de validación para API endpoints
 * Sanitiza y valida inputs de usuario para prevenir ataques
 */

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
 * Sanitiza un string para prevenir inyección de código
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 1000); // Limitar longitud
}

/**
 * Sanitiza un número
 */
export function sanitizeNumber(input: unknown): number | null {
  const num = Number(input);
  return isNaN(num) ? null : num;
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

  const sanitized = sanitizeString(producto);

  if (sanitized.length < 2) {
    errors.push('El producto debe tener al menos 2 caracteres');
  }

  if (sanitized.length > 200) {
    errors.push('El producto debe tener máximo 200 caracteres');
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
