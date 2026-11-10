import type { CustomerType } from '@/features/customers/types/customers.types'

export interface VehicleOwner {
  id: string
  type: CustomerType
  documentNumber: string
  firstName: string | null
  lastName: string | null
  legalName: string | null
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  customerId: string
  owner: VehicleOwner
  createdAt: string
  updatedAt: string
}

export interface VehicleFilters {
  search: string
  customerId?: string
  page: number
  pageSize: number
}

export interface VehicleCreateInput {
  plate: string
  brand: string
  model: string
  year: number
  customerId: string
}

export type VehicleUpdateInput = Omit<VehicleCreateInput, 'customerId'>

export interface VehiclesResponse {
  data: Vehicle[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface VehicleHistoryServiceLine {
  id: string
  name: string
  code: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface VehicleHistoryPartLine {
  id: string
  name: string
  code: string
  unitLabel: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface VehicleHistoryTimelineEntry {
  id: string
  code: string
  status: string
  source: string
  entryDate: string
  deliveredDate: string | null
  mileage: number | null
  fuelLevel: string | null
  diagnosis: string | null
  receptionNotes: string | null
  technician: {
    id: string
    fullName: string
  } | null
  services: VehicleHistoryServiceLine[]
  parts: VehicleHistoryPartLine[]
  total: number
}

export interface VehicleHistorySummary {
  totalVisits: number
  totalSpent: number
  lastMileage: number | null
  lastVisitAt: string | null
}

export interface VehicleHistoryResponse {
  vehicle: Vehicle
  summary: VehicleHistorySummary
  timeline: VehicleHistoryTimelineEntry[]
}
