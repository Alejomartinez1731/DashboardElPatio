/**
 * Esquemas de validación para presupuestos por categoría
 * Usa Zod para validación type-safe
 */

import { z } from 'zod';
import { CategoriaProducto, CATEGORIAS_INFO } from '@/types';

/**
 * Enum de categorías de productos
 */
export const categoriaProductoEnum = z.enum([
  'carnes',
  'lacteos',
  'verdura',
  'panaderia',
  'bebidas',
  'limpieza',
  'otros',
]);

/**
 * Schema para crear un nuevo presupuesto por categoría
 */
export const crearPresupuestoSchema = z.object({
  categoria: categoriaProductoEnum,
  monto: z.number({
    message: 'El monto es requerido',
  })
    .positive({ message: 'El monto debe ser mayor a 0' })
    .max(100000, { message: 'El monto no puede superar 100.000€' }),
  periodo_mes: z.number({
    message: 'El mes es requerido',
  })
    .int({ message: 'El mes debe ser un número entero' })
    .min(1, { message: 'El mes debe estar entre 1 y 12' })
    .max(12, { message: 'El mes debe estar entre 1 y 12' }),
  periodo_anio: z.number({
    message: 'El año es requerido',
  })
    .int({ message: 'El año debe ser un número entero' })
    .min(2020, { message: 'El año debe ser al menos 2020' })
    .max(2100, { message: 'El año no puede superar 2100' }),
  notas: z.string().max(500).default('').optional(),
});

/**
 * Schema para actualizar un presupuesto existente
 */
export const actualizarPresupuestoSchema = z.object({
  categoria: categoriaProductoEnum.optional(),
  monto: z.number()
    .positive({ message: 'El monto debe ser mayor a 0' })
    .max(100000, { message: 'El monto no puede superar 100.000€' })
    .optional(),
  periodo_mes: z.number()
    .int({ message: 'El mes debe ser un número entero' })
    .min(1, { message: 'El mes debe estar entre 1 y 12' })
    .max(12, { message: 'El mes debe estar entre 1 y 12' })
    .optional(),
  periodo_anio: z.number()
    .int({ message: 'El año debe ser un número entero' })
    .min(2020, { message: 'El año debe ser al menos 2020' })
    .max(2100, { message: 'El año no puede superar 2100' })
    .optional(),
  activo: z.boolean().optional(),
  notas: z.string().max(500).optional(),
});

/**
 * Schema para query params de la API de presupuestos
 */
export const presupuestoQuerySchema = z.object({
  categoria: categoriaProductoEnum.optional(),
  mes: z.coerce.number().int().min(1).max(12).optional(),
  anio: z.coerce.number().int().min(2020).max(2100).optional(),
  incluir_inactivos: z.enum(['true', 'false']).optional(),
});

/**
 * Schema para un presupuesto completo de la base de datos
 */
export const presupuestoSchema = z.object({
  id: z.string().uuid(),
  restaurante_id: z.string().uuid().nullable(),
  categoria: categoriaProductoEnum,
  monto: z.number().positive(),
  periodo_mes: z.number().int().min(1).max(12),
  periodo_anio: z.number().int().min(2020).max(2100),
  activo: z.boolean(),
  notas: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Schema para la vista de comparación presupuesto vs gasto
 */
export const presupuestoVsGastoSchema = z.object({
  id: z.string().uuid(),
  restaurante_id: z.string().uuid().nullable(),
  categoria: categoriaProductoEnum,
  presupuesto: z.number().nonnegative(),
  gasto_actual: z.number().nonnegative(),
  diferencia: z.number(),
  porcentaje_usado: z.number().min(0),
  periodo_mes: z.number().int().min(1).max(12),
  periodo_anio: z.number().int().min(2020).max(2100),
  activo: z.boolean(),
  notas: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Schema para array de presupuestos
 */
export const presupuestosArraySchema = z.array(presupuestoSchema);
export const presupuestosVsGastoArraySchema = z.array(presupuestoVsGastoSchema);

/**
 * Tipos inferidos de los esquemas
 */
export type PresupuestoCategoria = z.infer<typeof presupuestoSchema>;
export type PresupuestoVsGasto = z.infer<typeof presupuestoVsGastoSchema>;
export type CrearPresupuestoInput = z.infer<typeof crearPresupuestoSchema>;
export type ActualizarPresupuestoInput = z.infer<typeof actualizarPresupuestoSchema>;
export type PresupuestoQuery = z.infer<typeof presupuestoQuerySchema>;
export type CategoriaProductoEnum = z.infer<typeof categoriaProductoEnum>;

/**
 * Estado de alerta según porcentaje de uso
 */
export type EstadoAlerta = 'ok' | 'advertencia' | 'peligro' | 'excedido';

/**
 * Determina el estado de alerta según el porcentaje de uso
 */
export function determinarEstadoAlerta(porcentajeUsado: number): EstadoAlerta {
  if (porcentajeUsado >= 100) return 'excedido';
  if (porcentajeUsado >= 80) return 'peligro';
  if (porcentajeUsado >= 60) return 'advertencia';
  return 'ok';
}

/**
 * Función helper para validar un presupuesto completo
 */
export function validarPresupuesto(data: unknown): { success: boolean; data?: PresupuestoCategoria; errors?: z.ZodError } {
  const result = presupuestoSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Función helper para validar query params
 */
export function parsearPresupuestoQuery(params: unknown): PresupuestoQuery | null {
  const result = presupuestoQuerySchema.safeParse(params);
  return result.success ? result.data : null;
}

/**
 * Obtiene el color asociado a una categoría
 */
export function getColorCategoria(categoria: CategoriaProductoEnum): string {
  return CATEGORIAS_INFO[categoria]?.color || '#64748b';
}

/**
 * Obtiene el nombre legible de una categoría
 */
export function getNombreCategoria(categoria: CategoriaProductoEnum): string {
  return CATEGORIAS_INFO[categoria]?.nombre || 'Otros';
}

/**
 * Obtiene el icono de una categoría
 */
export function getIconoCategoria(categoria: CategoriaProductoEnum): string {
  return CATEGORIAS_INFO[categoria]?.icono || '📦';
}
