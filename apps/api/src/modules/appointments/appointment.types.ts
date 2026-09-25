export type AppointmentStatus = 'PROGRAMADA' | 'CANCELADA'
export type AppointmentStatusFilter = 'all' | AppointmentStatus

export interface AppointmentFilters {
  search?: string
  date?: string
  customerId?: string
  status: AppointmentStatusFilter
  page: number
  pageSize: number
}

export interface AppointmentScheduleInput {
  date: string
  time: string
}

export interface AppointmentInput extends AppointmentScheduleInput {
  customerId: string
  vehicleId: string
  reason: string
}

export type AppointmentRescheduleInput = AppointmentScheduleInput

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

export interface AppointmentItem {
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
  createdAt: string
  updatedAt: string
}

export interface AppointmentStats {
  total: number
  programadas: number
  canceladas: number
  hoy: number
}
