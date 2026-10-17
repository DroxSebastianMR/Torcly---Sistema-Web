import { z } from 'zod'
import { AuditEventType } from '../../generated/prisma/enums.js'

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  event: z
    .enum(
      Object.values(AuditEventType) as [AuditEventType, ...AuditEventType[]],
    )
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  actorId: z.uuid().optional(),
  identifier: z.string().trim().min(1).max(254).optional(),
})

export type AuditQuery = z.infer<typeof auditQuerySchema>
