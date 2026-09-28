import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  Vehicle,
  VehicleCreateInput,
  VehicleFilters,
  VehicleUpdateInput,
  VehiclesResponse,
} from '../types/vehicles.types'

interface DataResponse<T> {
  data: T
}

function buildQuery(filters: VehicleFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.customerId) query.set('customerId', filters.customerId)
  return query.toString()
}

export const vehiclesService = {
  list(filters: VehicleFilters, signal?: AbortSignal) {
    return api.get<VehiclesResponse>(
      `${endpoints.vehicles.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<Vehicle>>(endpoints.vehicles.detail(id), signal)
  },
  create(input: VehicleCreateInput) {
    return api.post<DataResponse<Vehicle>>(endpoints.vehicles.root, input)
  },
  update(id: string, input: VehicleUpdateInput) {
    return api.put<DataResponse<Vehicle>>(endpoints.vehicles.detail(id), input)
  },
}
