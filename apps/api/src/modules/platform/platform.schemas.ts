import { z } from 'zod'

const organizationCode = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .min(3, 'El código de organización debe tener al menos 3 caracteres.')
      .max(40)
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        'Usa minúsculas, números y guiones; sin espacios.',
      ),
  )

export const platformOrganizationQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const createPlatformOrganizationSchema = z.object({
  code: organizationCode,
  name: z.string().trim().min(3, 'Ingresa el nombre del taller.').max(160),
  owner: z.object({
    username: z
      .string()
      .trim()
      .min(3, 'El usuario debe tener al menos 3 caracteres.')
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
      .min(2, 'Ingresa el nombre del responsable.')
      .max(120),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(128),
    roleId: z.uuid('Selecciona un rol del taller.'),
  }),
})

export const platformOrganizationParamsSchema = z.object({
  organizationId: z.uuid('La organización indicada no es válida.'),
})

export const updatePlatformOrganizationStatusSchema = z.object({
  active: z.boolean(),
})

export const updatePlatformOrganizationSchema = z.object({
  code: organizationCode,
  name: z.string().trim().min(3, 'Ingresa el nombre del taller.').max(160),
  ownerRoleId: z.uuid('Selecciona un rol válido para el responsable.'),
  ownerName: z
    .string()
    .trim()
    .min(2, 'Ingresa el nombre del responsable.')
    .max(120)
    .optional(),
  ownerEmail: z
    .email('Ingresa un correo electrónico válido.')
    .max(254)
    .transform((value) => value.toLowerCase())
    .optional(),
})

const platformMemberIdentitySchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'El usuario debe tener al menos 3 caracteres.')
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
    .min(2, 'Ingresa el nombre del miembro.')
    .max(120),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(128),
  roleId: z.uuid('Selecciona un rol del taller.'),
})

export const createPlatformOrganizationMemberSchema =
  platformMemberIdentitySchema

export const platformOrganizationMemberParamsSchema = z.object({
  organizationId: z.uuid('La organización indicada no es válida.'),
  userId: z.uuid('El miembro indicado no es válido.'),
})

export const updatePlatformOrganizationMemberSchema = z
  .object({
    active: z.boolean().optional(),
    roleId: z.uuid('Selecciona un rol del taller.').optional(),
  })
  .refine((input) => input.active !== undefined || input.roleId !== undefined, {
    message: 'Indica al menos un cambio para el miembro.',
  })

export type PlatformOrganizationQueryDto = z.infer<
  typeof platformOrganizationQuerySchema
>
export type CreatePlatformOrganizationDto = z.infer<
  typeof createPlatformOrganizationSchema
>
export type UpdatePlatformOrganizationDto = z.infer<
  typeof updatePlatformOrganizationSchema
>
export type CreatePlatformOrganizationMemberDto = z.infer<
  typeof createPlatformOrganizationMemberSchema
>
