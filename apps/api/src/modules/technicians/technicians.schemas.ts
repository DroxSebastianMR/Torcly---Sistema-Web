import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null)

export const technicianIdSchema = z.object({ id: z.uuid('Técnico inválido.') })

export const technicianQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const technicianInputSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa el nombre completo.').max(120),
    document: optionalText(30),
    phone: optionalText(30),
    email: optionalText(254).pipe(
      z.string().email('Ingresa un correo válido.').nullable(),
    ),
    specialties: optionalText(500),
    notes: optionalText(500),
  })
  .strict()

export const technicianStatusSchema = z.object({ active: z.boolean() })

export type TechnicianInputDto = z.infer<typeof technicianInputSchema>
export type TechnicianQueryDto = z.infer<typeof technicianQuerySchema>
