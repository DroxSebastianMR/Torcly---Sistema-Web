import { z } from 'zod'

const identifierSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa tu usuario o correo electrónico.')
  .max(254, 'Usa un máximo de 254 caracteres.')

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Ingresa tu contraseña.').max(200),
})

export const passwordRecoverySchema = z.object({
  identifier: identifierSchema,
})

export const passwordResetSchema = z.object({
  token: z.string().min(20, 'El token no es válido.').max(200),
  password: z
    .string()
    .min(8, 'Usa al menos 8 caracteres.')
    .max(200, 'Usa un máximo de 200 caracteres.'),
})
