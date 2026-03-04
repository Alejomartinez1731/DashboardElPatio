/**
 * Esquemas de validación para autenticación
 * Usa Zod para validación type-safe
 */

import { z } from 'zod';

/**
 * Schema para login
 */
export const loginSchema = z.object({
  password: z.string()
    .min(1, { message: 'La contraseña es requerida' })
    .max(100, { message: 'La contraseña es demasiado larga' })
    .trim(),
});

/**
 * Schema para logout
 */
export const logoutSchema = z.object({
  allSessions: z.boolean().optional().default(false), // Cerrar todas las sesiones
});

/**
 * Schema para cambio de contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, { message: 'La contraseña actual es requerida' })
    .max(100, { message: 'La contraseña actual es demasiado larga' }),
  newPassword: z.string()
    .min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
    .max(100, { message: 'La nueva contraseña es demasiado larga' })
    .regex(/[A-Z]/, { message: 'La nueva contraseña debe tener al menos una mayúscula' })
    .regex(/[a-z]/, { message: 'La nueva contraseña debe tener al menos una minúscula' })
    .regex(/[0-9]/, { message: 'La nueva contraseña debe tener al menos un número' }),
  confirmPassword: z.string()
    .min(1, { message: 'Confirmar la contraseña es requerido' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/**
 * Tipos inferidos de los esquemas
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
