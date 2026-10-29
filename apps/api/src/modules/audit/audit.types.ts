import type { AuditEventType } from '../../generated/prisma/enums.js'

export interface AuditLogEntry {
  id: string
  event: AuditEventType
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

export interface AuditQueryFilters {
  event?: AuditEventType
  from?: Date
  to?: Date
  actorId?: string
  identifier?: string
  page: number
  pageSize: number
}
