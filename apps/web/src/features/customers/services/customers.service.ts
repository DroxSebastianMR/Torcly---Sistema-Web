import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  Customer,
  CustomerCreateInput,
  CustomerFilters,
  CustomerUpdateInput,
  CustomersResponse,
} from '../types/customers.types'

interface DataResponse<T> {
  data: T
}

function buildQuery(filters: CustomerFilters) {
  const query = new URLSearchParams({
    type: filters.type,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

export const customersService = {
  list(filters: CustomerFilters, signal?: AbortSignal) {
    return api.get<CustomersResponse>(
      `${endpoints.customers.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<Customer>>(
      endpoints.customers.detail(id),
      signal,
    )
  },
  create(input: CustomerCreateInput) {
    return api.post<DataResponse<Customer>>(endpoints.customers.root, input)
  },
  update(id: string, input: CustomerUpdateInput) {
    return api.put<DataResponse<Customer>>(
      endpoints.customers.detail(id),
      input,
    )
  },
}
