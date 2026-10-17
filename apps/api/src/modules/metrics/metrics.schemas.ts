import { z } from 'zod'

export const moduleLoadSchema = z.object({
  path: z.string().startsWith('/').max(200),
  durationMs: z.number().finite().min(0).max(120_000),
  navigationType: z.enum(['initial', 'route-change']),
})
