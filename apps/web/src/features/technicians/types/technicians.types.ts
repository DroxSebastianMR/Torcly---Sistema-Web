export interface Technician {
  id: string
  code: string
  fullName: string
  document: string | null
  phone: string | null
  email: string | null
  specialties: string | null
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}
export interface TechnicianInput {
  fullName: string
  document?: string | null
  phone?: string | null
  email?: string | null
  specialties?: string | null
  notes?: string | null
}
export interface TechnicianFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}
export interface TechniciansResponse {
  data: Technician[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
