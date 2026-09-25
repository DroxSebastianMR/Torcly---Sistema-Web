import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null)

export const serviceIdSchema = z.object({
  id: z.uuid('Servicio inválido.'),
})

export const serviceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const serviceInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'El código debe tener al menos 2 caracteres.')
      .max(40)
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
        'Usa letras, números, puntos, guiones o guion bajo.',
      )
      .transform((value) => value.toUpperCase()),
    name: z.string().trim().min(2, 'Ingresa el nombre del servicio.').max(120),
    description: optionalText(500),
    price: z.coerce
      .number()
      .finite()
      .min(0, 'El precio no puede ser negativo.')
      .max(9_999_999_999),
  })
  .strict()

export const serviceStatusSchema = z.object({
  active: z.boolean(),
})

export const serviceUpdateSchema = serviceInputSchema

export type ServiceInputDto = z.infer<typeof serviceInputSchema>
export type ServiceQueryDto = z.infer<typeof serviceQuerySchema>
