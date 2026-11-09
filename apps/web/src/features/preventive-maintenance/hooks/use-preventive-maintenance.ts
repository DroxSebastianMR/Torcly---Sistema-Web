import { useQuery } from '@tanstack/react-query'
import { preventiveMaintenanceService } from '../services/preventive-maintenance.service'
import type { PreventiveMaintenanceFilters } from '../types/preventive-maintenance.types'

export const preventiveMaintenanceKeys = {
  all: ['preventive-maintenance'] as const,
  reminders: (filters: PreventiveMaintenanceFilters) =>
    [...preventiveMaintenanceKeys.all, 'reminders', filters] as const,
}

export function usePreventiveMaintenance(filters: PreventiveMaintenanceFilters) {
  return useQuery({
    queryKey: preventiveMaintenanceKeys.reminders(filters),
    queryFn: ({ signal }) =>
      preventiveMaintenanceService.getReminders(filters, signal),
    staleTime: 30_000,
  })
}
