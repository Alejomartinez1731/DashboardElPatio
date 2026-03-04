/**
 * Esquemas de validación para compras
 * Usa Zod para validación type-safe
 */

import { z } from 'zod';

/**
 * Schema para una compra individual
 */
export const compraSchema = z.object({
  id: z.string().uuid({ message: 'ID debe ser un UUID válido' }),
  fecha: z.coerce.date({ message: 'La fecha debe ser válida' }),
  tienda: z.string()
    .min(1, { message: 'La tienda es requerida' })
    .max(200, { message: 'La tienda es demasiado larga' })
    .trim(),
  producto: z.string()
    .min(2, { message: 'El producto debe tener al menos 2 caracteres' })
    .max(300, { message: 'El producto es demasiado largo' })
    .trim(),
  cantidad: z.number({
    message: 'La cantidad debe ser un número',
  })
    .nonnegative({ message: 'La cantidad no puede ser negativa' })
    .max(10000, { message: 'La cantidad es demasiado grande' }),
  precioUnitario: z.number({
    message: 'El precio unitario debe ser un número',
  })
    .nonnegative({ message: 'El precio unitario no puede ser negativo' })
    .max(1000000, { message: 'El precio unitario es demasiado grande' }),
  total: z.number({
    message: 'El total debe ser un número',
  })
    .nonnegative({ message: 'El total no puede ser negativo' })
    .max(10000000, { message: 'El total es demasiado grande' }),
  telefono: z.string()
    .max(50, { message: 'El teléfono es demasiado largo' })
    .trim()
    .optional(),
  direccion: z.string()
    .max(500, { message: 'La dirección es demasiado larga' })
    .trim()
    .optional(),
});

/**
 * Schema para crear una nueva compra
 */
export const crearCompraSchema = compraSchema.extend({
  id: z.string().uuid().optional(), // ID opcional al crear (se genera automáticamente)
});

/**
 * Schema para datos crudos de Google Sheets
 */
export const compraRawSchema = z.object({
  fecha: z.string().optional(),
  tienda: z.string().optional(),
  descripcion: z.string().optional(),
  precio_unitario: z.union([z.string(), z.number()]).optional(),
  'precio unitario': z.union([z.string(), z.number()]).optional(), // Alternativa con espacio
  cantidad: z.union([z.string(), z.number()]).optional(),
  total: z.union([z.string(), z.number()]).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

/**
 * Schema para filtros de compras
 */
export const compraFiltroSchema = z.object({
  busqueda: z.string().max(200).optional(),
  tienda: z.string().max(200).optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().optional(),
  precioMin: z.number().nonnegative().optional(),
  precioMax: z.number().nonnegative().optional(),
  rangoFecha: z.enum(['hoy', 'semana', 'mes', 'trimestre', 'todo']).optional(),
  categoria: z.enum(['carnes', 'lacteos', 'verdura', 'panaderia', 'bebidas', 'limpieza', 'otros']).optional(),
});

/**
 * Schema para ordenamiento de compras
 */
export const compraOrdenSchema = z.object({
  campo: z.enum(['fecha', 'tienda', 'producto', 'cantidad', 'precioUnitario', 'total']),
  orden: z.enum(['asc', 'desc']),
});

/**
 * Tipos inferidos de los esquemas
 */
export type Compra = z.infer<typeof compraSchema>;
export type CrearCompraInput = z.infer<typeof crearCompraSchema>;
export type CompraRaw = z.infer<typeof compraRawSchema>;
export type CompraFiltro = z.infer<typeof compraFiltroSchema>;
export type CompraOrden = z.infer<typeof compraOrdenSchema>;

/**
 * Schema para array de compras
 */
export const comprasArraySchema = z.array(compraSchema);

/**
 * Función helper para validar datos crudos de Google Sheets
 * Retorna null si los datos son inválidos
 */
export function parsearCompraRaw(data: unknown): CompraRaw | null {
  const result = compraRawSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Función helper para validar una compra completa
 */
export function validarCompra(data: unknown): { success: boolean; data?: Compra; errors?: z.ZodError } {
  const result = compraSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
