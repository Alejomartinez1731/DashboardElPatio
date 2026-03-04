/**
 * Esquemas de validación para recordatorios
 * Usa Zod para validación type-safe
 */

import { z } from 'zod';

/**
 * Tipos de estados de recordatorio
 */
export const estadoRecordatorioEnum = z.enum(['ok', 'proximo', 'vencido', 'sin_datos']);

/**
 * Tipos de recordatorio
 */
export const tipoRecordatorioEnum = z.enum(['manual', 'automatico']);

/**
 * Schema para un recordatorio completo
 */
export const recordatorioSchema = z.object({
  producto: z.string()
    .min(2, { message: 'El producto debe tener al menos 2 caracteres' })
    .max(300, { message: 'El producto es demasiado largo' })
    .trim(),
  diasConfigurados: z.number({
    message: 'Los días configurados son requeridos',
  })
    .int({ message: 'Los días deben ser un número entero' })
    .positive({ message: 'Los días deben ser mayores a 0' })
    .max(90, { message: 'Los días no pueden superar 90' }),
  ultimaCompra: z.string().datetime().nullable(), // ISO date o null
  diasTranscurridos: z.number().int().nonnegative().nullable(), // null si nunca se compró
  estado: estadoRecordatorioEnum,
  tiendaUltimaCompra: z.string().max(200).nullable(),
  precioUltimaCompra: z.number().nonnegative().nullable(),
  notas: z.string().max(500).default(''),
  tipo: tipoRecordatorioEnum,
});

/**
 * Schema para crear un nuevo recordatorio manual
 */
export const crearRecordatorioSchema = z.object({
  producto: z.string()
    .min(2, { message: 'El producto debe tener al menos 2 caracteres' })
    .max(300, { message: 'El producto es demasiado largo' })
    .trim(),
  dias: z.number({
    message: 'Los días son requeridos',
  })
    .int({ message: 'Los días deben ser un número entero' })
    .positive({ message: 'Los días deben ser mayores a 0' })
    .max(90, { message: 'Los días no pueden superar 90' }),
  notas: z.string().max(500).default(''),
});

/**
 * Schema para actualizar un recordatorio
 */
export const actualizarRecordatorioSchema = z.object({
  producto: z.string()
    .min(2, { message: 'El producto debe tener al menos 2 caracteres' })
    .max(300, { message: 'El producto es demasiado largo' })
    .trim()
    .optional(),
  dias: z.number()
    .int({ message: 'Los días deben ser un número entero' })
    .positive({ message: 'Los días deben ser mayores a 0' })
    .max(90, { message: 'Los días no pueden superar 90' })
    .optional(),
  notas: z.string().max(500).optional(),
  activo: z.boolean().optional(),
});

/**
 * Schema para datos crudos de Google Sheets
 */
export const recordatorioRawSchema = z.object({
  producto: z.string().optional(),
  dias: z.union([z.string(), z.number()]).optional(),
  activo: z.union([z.string(), z.boolean()]).optional(),
  notas: z.string().optional(),
});

/**
 * Schema para query params de la API de recordatorios
 */
export const recordatorioQuerySchema = z.object({
  incluirAutomaticos: z.enum(['true', 'false']).optional(),
  estado: z.enum(['ok', 'proximo', 'vencido', 'sin_datos']).optional(),
  tipo: z.enum(['manual', 'automatico']).optional(),
});

/**
 * Tipos inferidos de los esquemas
 */
export type Recordatorio = z.infer<typeof recordatorioSchema>;
export type CrearRecordatorioInput = z.infer<typeof crearRecordatorioSchema>;
export type ActualizarRecordatorioInput = z.infer<typeof actualizarRecordatorioSchema>;
export type RecordatorioRaw = z.infer<typeof recordatorioRawSchema>;
export type RecordatorioQuery = z.infer<typeof recordatorioQuerySchema>;
export type EstadoRecordatorio = z.infer<typeof estadoRecordatorioEnum>;
export type TipoRecordatorio = z.infer<typeof tipoRecordatorioEnum>;

/**
 * Schema para array de recordatorios
 */
export const recordatoriosArraySchema = z.array(recordatorioSchema);

/**
 * Función helper para validar un recordatorio completo
 */
export function validarRecordatorio(data: unknown): { success: boolean; data?: Recordatorio; errors?: z.ZodError } {
  const result = recordatorioSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Función helper para validar query params
 */
export function parsearRecordatorioQuery(params: unknown): RecordatorioQuery | null {
  const result = recordatorioQuerySchema.safeParse(params);
  return result.success ? result.data : null;
}
