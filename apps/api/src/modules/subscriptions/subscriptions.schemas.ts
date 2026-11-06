import { z } from 'zod'

export const subscriptionStatusEnum = z.enum([
  'ACTIVE',
  'TRIAL',
  'PAST_DUE',
  'CANCELED',
  'SUSPENDED',
])

export const billingCycleEnum = z.enum(['MONTHLY', 'ANNUAL'])

export const platformSubscriptionQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(['all', 'ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELED', 'SUSPENDED'])
    .default('all'),
  planCode: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const updatePlatformSubscriptionSchema = z.object({
  planId: z.string().uuid('El plan seleccionado no es válido.').optional(),
  status: subscriptionStatusEnum.optional(),
  billingCycle: billingCycleEnum.optional(),
  renewsAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

export const assignSubscriptionSchema = z.object({
  organizationId: z.string().uuid('La organización indicada no es válida.'),
  planId: z.string().uuid('El plan seleccionado no es válido.'),
  status: subscriptionStatusEnum.default('ACTIVE'),
  billingCycle: billingCycleEnum.default('ANNUAL'),
  startsAt: z.string().datetime().optional(),
  renewsAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
})

export const createPlanSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'El código debe tener al menos 2 caracteres.')
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, 'Usa mayúsculas, números o guiones.'),
  name: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(120),
  description: z.string().trim().max(300).nullable().optional(),
  priceMonthly: z.coerce
    .number()
    .min(0, 'El precio mensual no puede ser negativo.'),
  priceYearly: z.coerce
    .number()
    .min(0, 'El precio anual no puede ser negativo.'),
  currency: z.string().trim().length(3).default('PEN'),
  maxMembers: z.coerce
    .number()
    .int()
    .min(1, 'Debe permitir al menos 1 miembro.'),
  maxTechnicians: z.coerce
    .number()
    .int()
    .min(1, 'Debe permitir al menos 1 técnico.'),
  maxProducts: z.coerce
    .number()
    .int()
    .min(1, 'Debe permitir al menos 1 producto.'),
  features: z.array(z.string().trim()).default([]),
  active: z.boolean().default(true),
  isPublic: z.boolean().default(true),
})

export const updatePlanSchema = createPlanSchema.partial().omit({ code: true })
