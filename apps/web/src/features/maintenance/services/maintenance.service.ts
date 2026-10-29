import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  MaintenanceScheduleInput,
  MaintenanceStatus,
  MaintenanceWindowAdmin,
} from '../types/maintenance.types'

export const maintenanceService = {
  status: (signal?: AbortSignal) =>
    api.get<MaintenanceStatus>(endpoints.maintenance.status, signal),
  windows: (signal?: AbortSignal) =>
    api.get<MaintenanceWindowAdmin[]>(endpoints.maintenance.windows, signal),
  schedule: (input: MaintenanceScheduleInput) =>
    api.post<MaintenanceWindowAdmin>(endpoints.maintenance.windows, input),
  cancel: (id: string) => api.delete<void>(endpoints.maintenance.window(id)),
}
