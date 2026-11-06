import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  ActiveVersionResponse,
  AnnouncementFilters,
  AnnouncementItem,
  AnnouncementsListResponse,
  CreateAnnouncementPayload,
  UnreadCountResponse,
  UpdateAnnouncementPayload,
} from '../types/announcements.types'

function buildQuery(filters: AnnouncementFilters): string {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.type) query.set('type', filters.type)
  if (filters.status) query.set('status', filters.status)
  if (filters.unreadOnly) query.set('unreadOnly', 'true')
  if (filters.search) query.set('search', filters.search)
  return query.toString()
}

export const announcementsService = {
  listAnnouncements(filters: AnnouncementFilters, signal?: AbortSignal) {
    return api.get<AnnouncementsListResponse>(
      `${endpoints.announcements.root}?${buildQuery(filters)}`,
      signal,
    )
  },

  getUnreadCount(signal?: AbortSignal) {
    return api.get<UnreadCountResponse>(
      endpoints.announcements.unreadCount,
      signal,
    )
  },

  getActiveVersion(signal?: AbortSignal) {
    return api.get<ActiveVersionResponse>(
      endpoints.announcements.activeVersion,
      signal,
    )
  },

  getAnnouncementById(id: string, signal?: AbortSignal) {
    return api.get<AnnouncementItem>(endpoints.announcements.detail(id), signal)
  },

  markAsRead(id: string) {
    return api.post<AnnouncementItem>(endpoints.announcements.markRead(id), {})
  },

  markAllAsRead() {
    return api.post<{ updatedCount: number }>(
      endpoints.announcements.markAllRead,
      {},
    )
  },

  createAnnouncement(payload: CreateAnnouncementPayload) {
    return api.post<AnnouncementItem>(endpoints.announcements.root, payload)
  },

  updateAnnouncement(id: string, payload: UpdateAnnouncementPayload) {
    return api.patch<AnnouncementItem>(
      endpoints.announcements.detail(id),
      payload,
    )
  },

  deleteAnnouncement(id: string) {
    return api.delete<{ success: boolean; id: string }>(
      endpoints.announcements.detail(id),
    )
  },

  generateVersionRelease() {
    return api.post<AnnouncementItem>(
      endpoints.announcements.generateVersionRelease,
      {},
    )
  },
}
