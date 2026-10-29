import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  NotificationFilters,
  NotificationItem,
  NotificationsResponse,
  UnreadCountResponse,
} from '../types/notifications.types'

function buildQuery(filters: NotificationFilters): string {
  const query = new URLSearchParams({
    read: filters.read,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.type) query.set('type', filters.type)
  return query.toString()
}

export const notificationsService = {
  listNotifications(filters: NotificationFilters, signal?: AbortSignal) {
    return api.get<NotificationsResponse>(
      `${endpoints.notifications.root}?${buildQuery(filters)}`,
      signal,
    )
  },

  getUnreadCount(signal?: AbortSignal) {
    return api.get<UnreadCountResponse>(
      endpoints.notifications.unreadCount,
      signal,
    )
  },

  markAsRead(id: string) {
    return api.patch<NotificationItem>(endpoints.notifications.markRead(id), {})
  },

  markAllAsRead() {
    return api.post<{ updatedCount: number }>(
      endpoints.notifications.markAllRead,
      {},
    )
  },
}
