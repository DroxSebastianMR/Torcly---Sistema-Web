import type { RequestContext } from '../auth/auth.types.js'

export interface UserIdentity {
  id: string
  username: string
  email: string
  displayName: string
  active: boolean
  roleIds: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface UserListFilters {
  search?: string
  status: 'all' | 'active' | 'inactive'
  page: number
  pageSize: number
}

export interface CreateUserInput {
  username: string
  email: string
  displayName: string
  password: string
  roleId: string
}

export interface UpdateUserInput {
  email: string
  displayName: string
}

export interface RoleOption {
  id: string
  code: string
  name: string
  permissions: string[]
}

export interface UserResponse extends UserIdentity {
  roles: RoleOption[]
}

export interface UserListResponse {
  data: UserResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface UserMutationInput {
  actor: { id: string }
  context: RequestContext
}
