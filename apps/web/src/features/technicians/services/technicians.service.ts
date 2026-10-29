import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  Technician,
  TechnicianFilters,
  TechnicianInput,
  TechniciansResponse,
} from '../types/technicians.types'
const query = (filters: TechnicianFilters) => {
  const params = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.search.trim()) params.set('search', filters.search.trim())
  return params
}
export const techniciansService = {
  list: (filters: TechnicianFilters, signal?: AbortSignal) =>
    api.get<TechniciansResponse>(
      `${endpoints.technicians.root}?${query(filters)}`,
      signal,
    ),
  create: (input: TechnicianInput) =>
    api.post<{ data: Technician }>(endpoints.technicians.root, input),
  update: (id: string, input: TechnicianInput) =>
    api.put<{ data: Technician }>(endpoints.technicians.detail(id), input),
  status: (id: string, active: boolean) =>
    api.patch<{ data: Technician }>(endpoints.technicians.status(id), {
      active,
    }),
}
