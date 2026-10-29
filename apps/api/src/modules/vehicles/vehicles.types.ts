import type { RequestContext } from '../auth/auth.types.js'
import type { CustomerType } from '../customers/customers.types.js'

export interface VehicleOwner {
  id: string
  type: CustomerType
  documentNumber: string
  firstName: string | null
  lastName: string | null
  legalName: string | null
}

export interface VehicleIdentity {
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

export interface VehicleListFilters {
  search?: string
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

export interface VehicleListResponse {
  data: VehicleIdentity[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type { RequestContext }
