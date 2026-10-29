export interface RoleOption {
  id: string
  code: string
  name: string
  permissions: string[]
}

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  active: boolean
  roleIds: string[]
  permissions: string[]
  roles: RoleOption[]
  createdAt: string
  updatedAt: string
}

export interface UserCreateInput {
  username: string
  email: string
  displayName: string
  password: string
  roleId: string
}

export interface UserUpdateInput {
  email: string
  displayName: string
}

export interface UserFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface UsersResponse {
  data: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
