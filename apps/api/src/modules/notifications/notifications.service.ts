import { AppError } from '../../shared/errors/app-error.js'
import type { AuthUser, RequestContext } from '../auth/auth.types.js'
import {
  notificationsRepository,
  type NotificationRecord,
} from './notifications.repository.js'
import type {
  NotificationFilters,
  NotificationItem,
  OperationalNotificationEvent,
} from './notifications.types.js'

function toNotificationItem(record: NotificationRecord): NotificationItem {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    type: record.type,
    link: record.link,
    permissionRequired: record.permissionRequired,
    read: record.read,
    readAt: record.readAt ? record.readAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  }
}

function paginate(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export const notificationsService = {
  async listNotifications(authUser: AuthUser, filters: NotificationFilters) {
    const result = await notificationsRepository.listNotifications(
      authUser.id,
      filters,
      authUser.permissions,
    )
    return {
      data: result.items.map(toNotificationItem),
      pagination: paginate(result.total, filters.page, filters.pageSize),
    }
  },

  async getUnreadCount(authUser: AuthUser) {
    const count = await notificationsRepository.getUnreadCount(
      authUser.id,
      authUser.permissions,
    )
    return { count }
  },

  async markAsRead(id: string, authUser: AuthUser, context: RequestContext) {
    const updated = await notificationsRepository.markAsRead(
      id,
      authUser.id,
      authUser.permissions,
      context,
    )
    if (!updated) {
      throw new AppError(
        404,
        'NOTIFICATION_NOT_FOUND',
        'Notificación no encontrada.',
      )
    }
    return toNotificationItem(updated)
  },

  async markAllAsRead(authUser: AuthUser, context: RequestContext) {
    return notificationsRepository.markAllAsRead(
      authUser.id,
      authUser.permissions,
      context,
    )
  },

  async notifyUsersSafely(event: OperationalNotificationEvent): Promise<void> {
    try {
      const eligibleUsers =
        await notificationsRepository.findUsersEligibleForNotification(
          event.permission,
          event.preferenceKey,
        )

      if (!eligibleUsers.length) return

      await notificationsRepository.createNotificationsBatch(
        eligibleUsers.map((user) => ({
          userId: user.id,
          title: event.title,
          message: event.message,
          type: event.type,
          link: event.link ?? null,
          permissionRequired: event.permission,
        })),
      )
    } catch {
      // Regla no negociable: la creación de notificaciones nunca bloquea ni revierte
      // transacciones críticas. No se registra el error crudo para evitar filtrar datos.
      console.warn('[notifications] safe_delivery_failed')
    }
  },
}
