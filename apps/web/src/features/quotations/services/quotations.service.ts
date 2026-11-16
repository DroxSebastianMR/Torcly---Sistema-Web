import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  QuotationCreateInput,
  QuotationDetail,
  QuotationConversionInput,
  QuotationFilters,
  QuotationsResponse,
  QuotationUpdateInput,
} from '../types/quotations.types'

function buildQuery(filters: QuotationFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.search.trim()) query.set('search', filters.search.trim())
  return query.toString()
}

export const quotationsService = {
  list(filters: QuotationFilters, signal?: AbortSignal) {
    return api.get<QuotationsResponse>(
      `${endpoints.quotations.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<QuotationDetail>>(
      endpoints.quotations.detail(id),
      signal,
    )
  },
  create(input: QuotationCreateInput) {
    return api.post<DataResponse<QuotationDetail>>(
      endpoints.quotations.root,
      input,
    )
  },
  update(id: string, input: QuotationUpdateInput) {
    return api.put<DataResponse<QuotationDetail>>(
      endpoints.quotations.detail(id),
      input,
    )
  },
  convertToOrder(id: string, input: QuotationConversionInput) {
    return api.post<
      DataResponse<{
        quotation: QuotationDetail
        workOrder: { id: string; code: string }
      }>
    >(endpoints.quotations.convertToOrder(id), input)
  },
}
