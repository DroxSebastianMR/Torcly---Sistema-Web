import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'

export const maintenanceRepository = {
  findActiveOrNext(now: Date) {
    return databaseService.client.maintenanceWindow.findFirst({
      where: { endsAt: { gt: now } },
      orderBy: { startsAt: 'asc' },
    })
  },

  list() {
    return databaseService.client.maintenanceWindow.findMany({
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
    })
  },

  create(
    data: {
      startsAt: Date
      endsAt: Date
      message: string
      createdBy: string
      actorId?: string
      requestId?: string
    },
    context: RequestContext,
  ) {
    const { requestId, actorId, ...window } = data
    return databaseService.transaction(async (transaction) => {
      const created = await transaction.maintenanceWindow.create({
        data: window,
      })
      await transaction.auditLog.create({
        data: {
          event: 'MAINTENANCE_SCHEDULED',
          userId: actorId,
          requestId: requestId ?? context.requestId,
          ipAddress: context.ipAddress,
          metadata: { maintenanceWindowId: created.id },
        },
      })
      return created
    })
  },

  cancel(id: string, actorId: string | undefined, context: RequestContext) {
    return databaseService.transaction(async (transaction) => {
      const deleted = await transaction.maintenanceWindow.deleteMany({
        where: { id },
      })
      if (deleted.count !== 1) return { cancelled: false as const }
      await transaction.auditLog.create({
        data: {
          event: 'MAINTENANCE_CANCELLED',
          userId: actorId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          metadata: { maintenanceWindowId: id },
        },
      })
      return { cancelled: true as const }
    })
  },
}
