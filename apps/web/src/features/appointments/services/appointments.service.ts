import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  Appointment,
  AppointmentInput,
  AppointmentRescheduleInput,
  AppointmentFilters,
  AppointmentsResponse,
  DataResponse,
} from '../types/appointments.types'

function buildQuery(filters: AppointmentFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.date) query.set('date', filters.date)
  if (filters.customerId) query.set('customerId', filters.customerId)
  if (filters.status !== 'all') query.set('status', filters.status)
  return query.toString()
}

export const appointmentsService = {
  list(filters: AppointmentFilters, signal?: AbortSignal) {
    return api.get<AppointmentsResponse>(
      `${endpoints.appointments.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<Appointment>>(
      endpoints.appointments.detail(id),
      signal,
    )
  },
  create(input: AppointmentInput) {
    return api.post<DataResponse<Appointment>>(
      endpoints.appointments.root,
      input,
    )
  },
  reschedule(id: string, input: AppointmentRescheduleInput) {
    return api.put<DataResponse<Appointment>>(
      endpoints.appointments.reschedule(id),
      input,
    )
  },
  cancel(id: string) {
    return api.post<DataResponse<Appointment>>(
      endpoints.appointments.cancel(id),
    )
  },
}
