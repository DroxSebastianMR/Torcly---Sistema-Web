export interface ServiceInput {
  code: string
  name: string
  description?: string | null
  price: number
}

export interface ServiceFilters {
  search?: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface ServiceResponse extends ServiceInput {
  id: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ServiceOption {
  id: string
  code: string
  name: string
}
