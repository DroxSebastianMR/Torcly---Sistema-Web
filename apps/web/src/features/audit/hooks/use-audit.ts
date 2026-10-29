import { useQuery } from '@tanstack/react-query'
import { auditService } from '../services/audit.service'
import type { AuditFilters } from '../types/audit.types'

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditFilters) => [...auditKeys.all, 'list', filters] as const,
}

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: ({ signal }) => auditService.list(filters, signal),
    placeholderData: (previous) => previous,
  })
}
