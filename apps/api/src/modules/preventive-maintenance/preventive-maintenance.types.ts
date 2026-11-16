export type MaintenancePriority = 'CRITICAL' | 'WARNING' | 'UP_TO_DATE'

export interface PreventiveMaintenanceItem {
  vehicleId: string
  plate: string
  brand: string
  model: string
  year: number
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  lastServiceDate: string | null
  lastOrderCode: string | null
  lastMileage: number | null
  daysSinceLastService: number
  priority: MaintenancePriority
  recommendedService: string
  suggestedMessage: string
}

export interface PreventiveMaintenanceMetrics {
  totalVehiclesAnalyzed: number
  criticalCount: number
  warningCount: number
  upToDateCount: number
}

export interface PreventiveMaintenanceQuery {
  priority?: 'all' | MaintenancePriority
  search?: string
}
