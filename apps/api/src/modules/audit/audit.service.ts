import { auditRepository } from './audit.repository.js'
import type { AuditLogPage } from './audit.types.js'
import type { AuditQuery } from './audit.schemas.js'

export const auditService = {
  async search(query: AuditQuery): Promise<AuditLogPage> {
    const { items, total } = await auditRepository.search({
      event: query.event,
      from: query.from,
      to: query.to,
      actorId: query.actorId,
      identifier: query.identifier,
      page: query.page,
      pageSize: query.pageSize,
    })

    return {
      items: items.map((item) => ({
        id: item.id,
        event: item.event,
        createdAt: item.createdAt.toISOString(),
        userId: item.userId,
        actorName: item.user?.displayName ?? null,
        identifier: item.identifier,
        requestId: item.requestId,
        ipAddress: item.ipAddress,
      })),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },
}
