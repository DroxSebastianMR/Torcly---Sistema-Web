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
