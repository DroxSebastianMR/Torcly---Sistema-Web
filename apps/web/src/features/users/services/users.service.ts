import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  RoleOption,
  User,
  UserCreateInput,
  UserFilters,
  UserUpdateInput,
  UsersResponse,
} from '../types/users.types'

interface DataResponse<T> {
  data: T
}

function buildQuery(filters: UserFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

export const usersService = {
  list(filters: UserFilters, signal?: AbortSignal) {
    return api.get<UsersResponse>(
      `${endpoints.users.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  roles(signal?: AbortSignal) {
    return api.get<DataResponse<RoleOption[]>>(endpoints.users.roles, signal)
  },
  create(input: UserCreateInput) {
    return api.post<DataResponse<User>>(endpoints.users.root, input)
  },
  update(id: string, input: UserUpdateInput) {
    return api.put<DataResponse<User>>(endpoints.users.detail(id), input)
  },
  updateRole(id: string, roleId: string) {
    return api.patch<DataResponse<User>>(endpoints.users.role(id), { roleId })
  },
  updateStatus(id: string, active: boolean) {
    return api.patch<DataResponse<User>>(endpoints.users.status(id), { active })
  },
}
