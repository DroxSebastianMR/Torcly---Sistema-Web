import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import type { RequestContext } from '../auth/auth.types.js'
import type { NotificationPreferences } from '../profile/profile.types.js'
import type {
  NotificationCreateInput,
  NotificationFilters,
} from './notifications.types.js'

const notificationSelect = {
  id: true,
  userId: true,
  title: true,
  message: true,
  type: true,
  link: true,
  permissionRequired: true,
  read: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect

export type NotificationRecord = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect
}>

const CATEGORY_MAP: Record<string, string[]> = {
  taller: ['WORK_ORDER_READY'],
  citas: [
    'APPOINTMENT_SCHEDULED',
    'APPOINTMENT_RESCHEDULED',
    'APPOINTMENT_OVERDUE',
  ],
  inventario: ['STOCK_LOW', 'PURCHASE_RECEIVED'],
  caja: ['PAYMENT_COMPENSATED', 'PAYMENT_DUE'],
  sistema: ['SYSTEM'],
}

function buildWhere(
  organizationId: string,
  userId: string,
  filters: NotificationFilters,
  userPermissions: string[],
): Prisma.NotificationWhereInput {
  const where: Prisma.NotificationWhereInput = {
    organizationId,
    userId,
    OR: [
      { permissionRequired: null },
      { permissionRequired: { in: userPermissions } },
    ],
  }

  if (filters.read === 'true') where.read = true
  if (filters.read === 'false') where.read = false

  if (filters.type) {
    where.type = filters.type
  } else if (filters.category && CATEGORY_MAP[filters.category.toLowerCase()]) {
    where.type = { in: CATEGORY_MAP[filters.category.toLowerCase()] }
  }

  if (filters.days && filters.days > 0) {
    const cutoffDate = new Date(Date.now() - filters.days * 24 * 60 * 60 * 1000)
    where.createdAt = { gte: cutoffDate }
  }

  return where
}

export const notificationsRepository = {
  async listNotifications(
    organizationId: string,
    userId: string,
    filters: NotificationFilters,
    userPermissions: string[],
  ) {
    const where = buildWhere(organizationId, userId, filters, userPermissions)
    const [items, total] = await Promise.all([
      databaseService.client.notification.findMany({
        where,
        select: notificationSelect,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      databaseService.client.notification.count({ where }),
    ])
    return { items, total }
  },

  async getUnreadCount(
    organizationId: string,
    userId: string,
    userPermissions: string[],
  ) {
    return databaseService.client.notification.count({
      where: {
        organizationId,
        userId,
        read: false,
        OR: [
          { permissionRequired: null },
          { permissionRequired: { in: userPermissions } },
        ],
      },
    })
  },

  async findNotificationById(
    id: string,
    userId: string,
    organizationId: string,
  ) {
    return databaseService.client.notification.findFirst({
      where: { id, userId, organizationId },
      select: notificationSelect,
    })
  },

  async markAsRead(
    id: string,
    organizationId: string,
    userId: string,
    userPermissions: string[],
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const existing = await tx.notification.findFirst({
        where: {
          id,
          organizationId,
          userId,
          OR: [
            { permissionRequired: null },
            { permissionRequired: { in: userPermissions } },
          ],
        },
        select: notificationSelect,
      })

      if (!existing) return null

      if (existing.read) return existing

      const updated = await tx.notification.update({
        where: { id },
        data: {
          read: true,
          readAt: new Date(),
        },
        select: notificationSelect,
      })

      await tx.auditLog.create({
        data: {
          event: 'NOTIFICATION_READ',
          userId,
          organizationId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          metadata: { notificationId: id, type: updated.type },
        },
      })

      return updated
    })
  },

  async markAllAsRead(
    organizationId: string,
    userId: string,
    userPermissions: string[],
    context: RequestContext,
  ) {
    return databaseService.transaction(async (tx) => {
      const where: Prisma.NotificationWhereInput = {
        organizationId,
        userId,
        read: false,
        OR: [
          { permissionRequired: null },
          { permissionRequired: { in: userPermissions } },
        ],
      }

      const count = await tx.notification.count({ where })
      if (count === 0) return { updatedCount: 0 }

      const now = new Date()
      await tx.notification.updateMany({
        where,
        data: {
          read: true,
          readAt: now,
        },
      })

      await tx.auditLog.create({
        data: {
          event: 'ALL_NOTIFICATIONS_READ',
          userId,
          organizationId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          metadata: { markedCount: count },
        },
      })

      return { updatedCount: count }
    })
  },

  async createNotificationsBatch(items: NotificationCreateInput[]) {
    if (!items.length) return
    return databaseService.client.notification.createMany({
      data: items.map((item) => ({
        organizationId: item.organizationId,
        userId: item.userId,
        title: item.title,
        message: item.message,
        type: item.type,
        link: item.link ?? null,
        permissionRequired: item.permissionRequired ?? null,
        read: false,
      })),
    })
  },

  async findUsersEligibleForNotification(
    organizationId: string,
    permission: string,
    preferenceKey?: keyof NotificationPreferences,
  ) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        organizationId,
      )
    ) {
      return []
    }
    try {
      const users = await databaseService.client.user.findMany({
        where: {
          active: true,
          organizationMemberships: {
            some: {
              organizationId,
              active: true,
              role: {
                active: true,
                permissions: {
                  some: {
                    permission: { code: permission },
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          notificationPreferences: true,
        },
      })

      return users.filter((u) => {
        if (!preferenceKey) return true
        const prefs =
          u.notificationPreferences as Partial<NotificationPreferences> | null
        if (!prefs) return true
        return prefs[preferenceKey] !== false
      })
    } catch {
      return []
    }
  },
}
