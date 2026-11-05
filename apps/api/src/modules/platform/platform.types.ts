export interface PlatformOrganizationFilters {
  search?: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}
