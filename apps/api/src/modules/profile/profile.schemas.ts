import { z } from 'zod'

export const profileIdParamSchema = z.object({
  id: z.uuid('Identificador inválido.').optional(),
})

export const notificationPreferencesSchema = z
  .object({
    stockLow: z.boolean().optional(),
    purchaseReceived: z.boolean().optional(),
    appointmentUpdates: z.boolean().optional(),
    workOrderReady: z.boolean().optional(),
    paymentCompensated: z.boolean().optional(),
  })
  .strict()

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(120, 'El nombre es demasiado largo.'),
    notificationPreferences: notificationPreferencesSchema.optional(),
  })
  .strict()

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Ingresa tu contraseña actual.')
      .max(200, 'Contraseña demasiado larga.'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
      .max(200, 'Contraseña demasiado larga.'),
  })
  .strict()

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>
