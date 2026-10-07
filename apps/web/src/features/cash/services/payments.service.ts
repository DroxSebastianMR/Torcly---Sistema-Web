import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  DataResponse,
  PaymentCompensateInput,
  PaymentDetail,
  PaymentFilters,
  PaymentRegisterInput,
  PaymentsResponse,
} from '../types/payment.types'

function buildQuery(filters: PaymentFilters) {
  const query = new URLSearchParams({
    status: filters.status,
    method: filters.method,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })

  if (filters.search.trim()) query.set('search', filters.search.trim())
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  return query.toString()
}

export const paymentsService = {
  list(filters: PaymentFilters, signal?: AbortSignal) {
    return api.get<PaymentsResponse>(
      `${endpoints.payments.root}?${buildQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<PaymentDetail>>(
      endpoints.payments.detail(id),
      signal,
    )
  },
  pay(saleId: string, input: PaymentRegisterInput) {
    return api.post<DataResponse<PaymentDetail>>(
      endpoints.payments.pay(saleId),
      input,
    )
  },
  compensate(paymentId: string, input: PaymentCompensateInput) {
    return api.post<DataResponse<PaymentDetail>>(
      endpoints.payments.compensate(paymentId),
      input,
    )
  },
}
