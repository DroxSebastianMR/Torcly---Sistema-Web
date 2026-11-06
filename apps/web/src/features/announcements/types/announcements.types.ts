export type AnnouncementType = 'UPDATE' | 'MAINTENANCE' | 'COMMUNICATION'
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface AnnouncementItem {
  id: string
  title: string
  summary: string
  content: string
  type: AnnouncementType
  status: AnnouncementStatus
  versionTag: string | null
  videoUrl: string | null
  startsAt: string | null
  endsAt: string | null
  publishedAt: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isRead: boolean
  readAt: string | null
}

export interface AnnouncementFilters {
  page: number
  pageSize: number
  type?: AnnouncementType
  status?: AnnouncementStatus
  unreadOnly?: boolean
  search?: string
}

export interface AnnouncementsListResponse {
  data: AnnouncementItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface UnreadCountResponse {
  count: number
}

export interface ActiveVersionResponse {
  version: string
  versionTag: string
  releasedAt: string
  productName: string
}

export interface CreateAnnouncementPayload {
  title: string
  summary: string
  content: string
  type: AnnouncementType
  status?: AnnouncementStatus
  versionTag?: string | null
  videoUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
  notifyUsers?: boolean
}

export interface UpdateAnnouncementPayload {
  title?: string
  summary?: string
  content?: string
  type?: AnnouncementType
  status?: AnnouncementStatus
  versionTag?: string | null
  videoUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
  notifyUsers?: boolean
}
