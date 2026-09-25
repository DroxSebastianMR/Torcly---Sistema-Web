export interface ServiceInput {
  code: string
  name: string
  description: string | null
  price: number
}

export interface Service extends ServiceInput {
  id: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface ServiceOption {
  id: string
  code: string
  name: string
}

export interface ServicesResponse {
  data: Service[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface DataResponse<T> {
  data: T
}
