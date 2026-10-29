import { z } from 'zod'

export const notificationIdSchema = z.object({
  id: z.uuid('Notificación inválida.'),
})

export const notificationQuerySchema = z.object({
  read: z.enum(['all', 'true', 'false']).default('all'),
  type: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>
