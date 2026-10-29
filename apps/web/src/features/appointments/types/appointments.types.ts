export type AppointmentStatus = 'PROGRAMADA' | 'CANCELADA' | 'ATENDIDA'
export type AppointmentStatusFilter = 'all' | AppointmentStatus

export interface AppointmentCustomerRef {
  id: string
  documentNumber: string
  name: string
}

export interface AppointmentVehicleRef {
  id: string
  plate: string
  brand: string
  model: string
  year: number
}

export interface Appointment {
  id: string
  code: string
  customer: AppointmentCustomerRef | null
  vehicle: AppointmentVehicleRef
  date: string
  time: string
  reason: string
  status: AppointmentStatus
  performedBy: string
  rescheduledBy: string | null
  rescheduledAt: string | null
  cancelledBy: string | null
  cancelledAt: string | null
  attendedBy: string | null
  attendedAt: string | null
  workOrder: { id: string; code: string } | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentInput {
  customerId: string
  vehicleId: string
  date: string
  time: string
  reason: string
}

export interface AppointmentRescheduleInput {
  date: string
  time: string
}

export interface AppointmentFilters {
  search: string
  date: string
  customerId: string
  status: AppointmentStatusFilter
  page: number
  pageSize: number
}

export interface AppointmentStats {
  total: number
  programadas: number
  canceladas: number
  hoy: number
}

export interface AppointmentPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AppointmentsResponse {
  data: Appointment[]
  pagination: AppointmentPagination
  summary: AppointmentStats
}

export interface DataResponse<T> {
  data: T
}
