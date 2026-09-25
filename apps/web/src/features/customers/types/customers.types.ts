export type CustomerType = 'NATURAL' | 'LEGAL'
export type CustomerTypeFilter = 'all' | CustomerType

export interface Customer {
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
}

export interface CustomerFilters {
  search: string
  type: CustomerTypeFilter
  page: number
  pageSize: number
}

export type CustomerCreateInput =
  | {
      type: 'NATURAL'
      documentNumber: string
      firstName: string
      lastName: string
      phone: string
      email?: string | null
    }
  | {
      type: 'LEGAL'
      documentNumber: string
      legalName: string
      phone: string
      email?: string | null
    }

export type CustomerUpdateInput = CustomerCreateInput

export interface CustomersResponse {
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
