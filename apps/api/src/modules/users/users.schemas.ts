import { z } from 'zod'

export const userIdSchema = z.object({
  id: z.uuid('Usuario inválido.'),
})

export const userQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres.')
    .max(50)
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
      'Usa letras, números, puntos, guiones o guion bajo.',
    )
    .transform((value) => value.toLowerCase()),
  email: z
    .email('Ingresa un correo electrónico válido.')
    .max(254)
    .transform((value) => value.toLowerCase()),
  displayName: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre del usuario.')
    .max(120),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128),
  roleId: z.uuid('Selecciona un rol.'),
})

export const updateUserSchema = z.object({
  email: z
    .email('Ingresa un correo electrónico válido.')
    .max(254)
    .transform((value) => value.toLowerCase()),
  displayName: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre del usuario.')
    .max(120),
})

export const userRoleSchema = z.object({
  roleId: z.uuid('Selecciona un rol.'),
})

export const userStatusSchema = z.object({
  active: z.boolean(),
})

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type UserQueryDto = z.infer<typeof userQuerySchema>
