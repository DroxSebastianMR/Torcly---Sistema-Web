export interface AuditLogEntry {
  id: string
  event: string
  createdAt: string
  userId: string | null
  actorName: string | null
  identifier: string | null
  requestId: string | null
  ipAddress: string | null
}

export interface AuditLogPage {
  items: AuditLogEntry[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AuditFilters {
  page: number
  pageSize: number
  event?: string
  from?: string
  to?: string
  identifier?: string
}
