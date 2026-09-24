import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Ingresa tu usuario o correo electrónico.')
    .max(254, 'Usa un máximo de 254 caracteres.'),
  password: z.string().min(1, 'Ingresa tu contraseña.').max(200),
})
