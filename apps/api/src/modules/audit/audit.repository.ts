import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { AuditQueryFilters } from './audit.types.js'

function buildWhere(filters: AuditQueryFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {}
  if (filters.event) where.event = filters.event
  if (filters.actorId) where.userId = filters.actorId
  if (filters.identifier) {
    where.identifier = { equals: filters.identifier, mode: 'insensitive' }
  }
  if (filters.from || filters.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = filters.from
    if (filters.to) where.createdAt.lte = filters.to
  }
  return where
}

export const auditRepository = {
  async search(filters: AuditQueryFilters) {
    const where = buildWhere(filters)
    const [items, total] = await Promise.all([
      databaseService.client.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: {
          id: true,
          event: true,
          createdAt: true,
          userId: true,
          identifier: true,
          requestId: true,
          ipAddress: true,
          user: { select: { displayName: true } },
        },
      }),
      databaseService.client.auditLog.count({ where }),
    ])
    return { items, total }
  },
}
