import { z } from 'zod'
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Ingresa tu usuario o correo electrónico')
    .max(254, 'Usa un máximo de 254 caracteres')
    .refine(
      (value) => !/\s/.test(value),
      'No incluyas espacios en el usuario o correo',
    )
    .refine(
      (value) => !value.includes('@') || z.email().safeParse(value).success,
      'Ingresa un correo electrónico válido',
    ),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export const recoverySchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Ingresa tu usuario o correo electrónico')
    .max(254, 'Usa un máximo de 254 caracteres')
    .refine(
      (value) => !/\s/.test(value),
      'No incluyas espacios en el usuario o correo',
    )
    .refine(
      (value) => !value.includes('@') || z.email().safeParse(value).success,
      'Ingresa un correo electrónico válido',
    ),
})
export type RecoveryFormValues = z.infer<typeof recoverySchema>
export const resetSchema = z
  .object({
    password: z.string().min(8, 'Usa al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
