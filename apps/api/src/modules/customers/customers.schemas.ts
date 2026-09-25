import { z } from 'zod'

const emailInput = z
  .email('Ingresa un correo electrónico válido.')
  .max(254)
  .optional()
  .nullable()
  .transform((value) => value || null)

const phoneInput = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{5,14}$/, 'Ingresa un teléfono válido.')

const naturalFields = {
  type: z.literal('NATURAL'),
  documentNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos.'),
  firstName: z.string().trim().min(2, 'Ingresa los nombres.').max(80),
  lastName: z.string().trim().min(2, 'Ingresa los apellidos.').max(80),
  phone: phoneInput,
  email: emailInput,
}

const legalFields = {
  type: z.literal('LEGAL'),
  documentNumber: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos.'),
  legalName: z.string().trim().min(3, 'Ingresa la razón social.').max(160),
  phone: phoneInput,
  email: emailInput,
}

export const customerIdSchema = z.object({
  id: z.uuid('Cliente inválido.'),
})

export const customerQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  type: z.enum(['all', 'NATURAL', 'LEGAL']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const customerInputSchema = z.discriminatedUnion('type', [
  z.object(naturalFields),
  z.object(legalFields),
])

export type CustomerInputDto = z.infer<typeof customerInputSchema>
export type CustomerQueryDto = z.infer<typeof customerQuerySchema>
