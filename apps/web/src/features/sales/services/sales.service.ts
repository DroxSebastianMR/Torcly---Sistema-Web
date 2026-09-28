import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  SaleCatalog,
  SaleDetail,
  SaleFilters,
  SaleInput,
  SalesResponse,
} from '../types/sales.types'

function buildQuery(filters: SaleFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

export const salesService = {
  list(filters: SaleFilters, signal?: AbortSignal) {
    return api.get<SalesResponse>(
      `${endpoints.sales.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<SaleDetail>>(endpoints.sales.detail(id), signal)
  },
  catalog(signal?: AbortSignal) {
    return api.get<DataResponse<SaleCatalog>>(endpoints.sales.catalog, signal)
  },
  create(input: SaleInput) {
    return api.post<DataResponse<SaleDetail>>(endpoints.sales.root, input)
  },
  update(id: string, input: SaleInput) {
    return api.put<DataResponse<SaleDetail>>(endpoints.sales.detail(id), input)
  },
  confirm(id: string) {
    return api.post<DataResponse<SaleDetail>>(endpoints.sales.confirm(id))
  },
}
