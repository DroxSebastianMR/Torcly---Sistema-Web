import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '../services/notifications.service'
import type { NotificationFilters } from '../types/notifications.types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.all, 'list', filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export function useNotifications(filters: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: ({ signal }) =>
      notificationsService.listNotifications(filters, signal),
  })
}

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => notificationsService.getUnreadCount(signal),
    enabled,
    refetchInterval: 30_000,
  })
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()

  return {
    markAsRead: useMutation({
      mutationFn: (id: string) => notificationsService.markAsRead(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      },
    }),
    markAllAsRead: useMutation({
      mutationFn: () => notificationsService.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      },
    }),
  }
}
