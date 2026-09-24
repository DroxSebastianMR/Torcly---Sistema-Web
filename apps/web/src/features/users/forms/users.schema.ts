import { z } from 'zod'

export const userCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
    .max(50, 'El nombre de usuario no puede superar 50 caracteres.')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
      'Solo se permiten letras, números y . _ - sin espacios.',
    ),
  email: z
    .email('Ingresa un correo electrónico válido.')
    .max(254, 'El correo no puede superar 254 caracteres.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre del usuario.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128, 'La contraseña no puede superar 128 caracteres.'),
  roleId: z.string().min(1, 'Selecciona un rol.'),
})

export const userProfileSchema = z.object({
  email: z
    .email('Ingresa un correo electrónico válido.')
    .max(254, 'El correo no puede superar 254 caracteres.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre del usuario.')
    .max(120, 'El nombre no puede superar 120 caracteres.'),
})

export type UserCreateValues = z.infer<typeof userCreateSchema>
export type UserProfileValues = z.infer<typeof userProfileSchema>
