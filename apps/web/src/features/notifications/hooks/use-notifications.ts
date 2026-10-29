import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { notificationsService } from '../services/notifications.service'
import type { NotificationFilters } from '../types/notifications.types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: NotificationFilters) =>
    [...notificationKeys.all, 'list', filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export function useNotifications(filters: NotificationFilters, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: ({ signal }) =>
      notificationsService.listNotifications(filters, signal),
    enabled,
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
      onMutate: () => ({ toastId: startActionToast('Marcando notificación…') }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      },
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
    markAllAsRead: useMutation({
      mutationFn: () => notificationsService.markAllAsRead(),
      onMutate: () => ({
        toastId: startActionToast('Marcando todas las notificaciones…'),
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      },
      onSettled: (_data, _error, _variables, context) =>
        finishActionToast(context?.toastId),
    }),
  }
}
