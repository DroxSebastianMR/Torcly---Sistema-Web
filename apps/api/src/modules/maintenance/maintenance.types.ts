export type MaintenanceWindowStatus = 'scheduled' | 'active' | 'past'

export interface MaintenanceWindowView {
  id: string
  startsAt: string
  endsAt: string
  message: string
  status: MaintenanceWindowStatus
}

export interface MaintenanceStatus {
  generatedAt: string
  window: MaintenanceWindowView | null
}

export interface MaintenanceWindowAdmin {
  id: string
  startsAt: string
  endsAt: string
  message: string
  createdBy: string
  createdAt: string
}

export interface MaintenanceScheduleInput {
  startsAt: Date
  endsAt: Date
  message: string
}
