import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type { AuditFilters, AuditLogPage } from '../types/audit.types'

export const auditService = {
  list: (filters: AuditFilters, signal?: AbortSignal) => {
    const params = new URLSearchParams()
    params.set('page', String(filters.page))
    params.set('pageSize', String(filters.pageSize))
    if (filters.event) params.set('event', filters.event)
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.identifier) params.set('identifier', filters.identifier)
    return api.get<AuditLogPage>(
      `${endpoints.audit.root}?${params.toString()}`,
      signal,
    )
  },
}
