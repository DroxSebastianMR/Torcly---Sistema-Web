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

export interface CreateAnnouncementInput {
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

export interface UpdateAnnouncementInput {
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
