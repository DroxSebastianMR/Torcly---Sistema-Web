import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  Service,
  ServiceFilters,
  ServiceInput,
  ServiceOption,
  ServicesResponse,
} from '../types/services.types'

function buildQuery(filters: ServiceFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

export const servicesService = {
  list(filters: ServiceFilters, signal?: AbortSignal) {
    return api.get<ServicesResponse>(
      `${endpoints.services.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  options(signal?: AbortSignal) {
    return api.get<DataResponse<ServiceOption[]>>(
      endpoints.services.options,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<Service>>(endpoints.services.detail(id), signal)
  },
  create(input: ServiceInput) {
    return api.post<DataResponse<Service>>(endpoints.services.root, input)
  },
  update(id: string, input: ServiceInput) {
    return api.put<DataResponse<Service>>(endpoints.services.detail(id), input)
  },
  updateStatus(id: string, active: boolean) {
    return api.patch<DataResponse<Service>>(endpoints.services.status(id), {
      active,
    })
  },
}
