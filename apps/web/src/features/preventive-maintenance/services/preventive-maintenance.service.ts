import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  PreventiveMaintenanceFilters,
  PreventiveMaintenanceResponse,
} from '../types/preventive-maintenance.types'

function toQueryString(filters: PreventiveMaintenanceFilters) {
  const params = new URLSearchParams()
  if (filters.priority && filters.priority !== 'all') {
    params.set('priority', filters.priority)
  }
  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const preventiveMaintenanceService = {
  getReminders: (filters: PreventiveMaintenanceFilters, signal?: AbortSignal) =>
    api.get<PreventiveMaintenanceResponse>(
      `${endpoints.preventiveMaintenance.root}${toQueryString(filters)}`,
      signal,
    ),
}
