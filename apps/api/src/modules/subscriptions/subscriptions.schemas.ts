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
