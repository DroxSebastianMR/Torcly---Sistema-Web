import type { RequestContext } from '../auth/auth.types.js'

export type CustomerType = 'NATURAL' | 'LEGAL'

export interface CustomerVehicleInput {
  plate: string
  brand: string
  model: string
  year: number
  mileage?: number | null
}

export interface CreatedVehicleSummary {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  mileage: number | null
}

export interface CustomerIdentity {
  id: string
  type: CustomerType
  documentNumber: string
  firstName: string | null
  lastName: string | null
  legalName: string | null
  phone: string
  email: string | null
  createdAt: string
  updatedAt: string
  createdVehicle?: CreatedVehicleSummary | null
}

export interface CustomerListFilters {
  search?: string
  type: 'all' | CustomerType
  page: number
  pageSize: number
}

interface CustomerBaseInput {
  phone: string
  email?: string | null
  vehicle?: CustomerVehicleInput | null
}

export interface NaturalCustomerInput extends CustomerBaseInput {
  type: 'NATURAL'
  documentNumber: string
  firstName: string
  lastName: string
}

export interface LegalCustomerInput extends CustomerBaseInput {
  type: 'LEGAL'
  documentNumber: string
  legalName: string
}

export type CreateCustomerInput = NaturalCustomerInput | LegalCustomerInput
export type UpdateCustomerInput = CreateCustomerInput

export interface CustomerListResponse {
  data: CustomerIdentity[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type { RequestContext }
