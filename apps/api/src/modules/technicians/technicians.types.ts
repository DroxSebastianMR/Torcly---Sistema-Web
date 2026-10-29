export interface TechnicianInput {
  fullName: string
  document?: string | null
  phone?: string | null
  email?: string | null
  specialties?: string | null
  notes?: string | null
}

export interface TechnicianFilters {
  search?: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface TechnicianResponse extends TechnicianInput {
  id: string
  code: string
  active: boolean
  createdAt: string
  updatedAt: string
}
