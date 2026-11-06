import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishActionToast, startActionToast } from '@/lib/action-toast'
import { announcementsService } from '../services/announcements.service'
import type {
  AnnouncementFilters,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types/announcements.types'

export const announcementKeys = {
  all: ['announcements'] as const,
  list: (filters: AnnouncementFilters) =>
    [...announcementKeys.all, 'list', filters] as const,
  unreadCount: () => [...announcementKeys.all, 'unread-count'] as const,
  activeVersion: () => [...announcementKeys.all, 'active-version'] as const,
  detail: (id: string) => [...announcementKeys.all, 'detail', id] as const,
}

export function useAnnouncements(filters: AnnouncementFilters, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.list(filters),
    queryFn: ({ signal }) =>
      announcementsService.listAnnouncements(filters, signal),
    enabled,
  })
}

export function useUnreadAnnouncementsCount(enabled = true) {
  return useQuery({
    queryKey: announcementKeys.unreadCount(),
    queryFn: ({ signal }) => announcementsService.getUnreadCount(signal),
    enabled,
    refetchInterval: 30_000,
  })
}

export function useActiveVersion(enabled = true) {
  return useQuery({
    queryKey: announcementKeys.activeVersion(),
    queryFn: ({ signal }) => announcementsService.getActiveVersion(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAnnouncementMutations() {
  const queryClient = useQueryClient()

  const markAsRead = useMutation({
    mutationFn: (id: string) => announcementsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: () => announcementsService.markAllAsRead(),
    onMutate: () => ({
      toastId: startActionToast('Marcando todas las novedades…'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
    onSettled: (_data, _error, _variables, context) =>
      finishActionToast(context?.toastId),
  })

  const createAnnouncement = useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      announcementsService.createAnnouncement(payload),
    onMutate: () => ({
      toastId: startActionToast('Publicando anuncio…'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
    onSettled: (_data, _error, _variables, context) =>
      finishActionToast(context?.toastId),
  })

  const updateAnnouncement = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: UpdateAnnouncementPayload
    }) => announcementsService.updateAnnouncement(id, payload),
    onMutate: () => ({
      toastId: startActionToast('Guardando cambios del anuncio…'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
    onSettled: (_data, _error, _variables, context) =>
      finishActionToast(context?.toastId),
  })

  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => announcementsService.deleteAnnouncement(id),
    onMutate: () => ({
      toastId: startActionToast('Eliminando anuncio…'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
    onSettled: (_data, _error, _variables, context) =>
      finishActionToast(context?.toastId),
  })

  const generateVersionRelease = useMutation({
    mutationFn: () => announcementsService.generateVersionRelease(),
    onMutate: () => ({
      toastId: startActionToast('Generando lanzamiento de versión v1.1.2…'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all })
    },
    onSettled: (_data, _error, _variables, context) =>
      finishActionToast(context?.toastId),
  })

  return {
    markAsRead,
    markAllAsRead,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    generateVersionRelease,
  }
}
