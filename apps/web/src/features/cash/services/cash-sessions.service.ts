import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  CashSession,
  CashSessionCloseInput,
  CashSessionFilters,
  CashSessionOpenInput,
  CashSessionsResponse,
  DataResponse,
} from '../types/cash-session.types'

function listQuery(filters: CashSessionFilters) {
  return new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  }).toString()
}

export const cashSessionsService = {
  current(signal?: AbortSignal) {
    return api.get<DataResponse<CashSession | null>>(
      endpoints.cashSessions.current,
      signal,
    )
  },
  list(filters: CashSessionFilters, signal?: AbortSignal) {
    return api.get<CashSessionsResponse>(
      `${endpoints.cashSessions.root}?${listQuery(filters)}`,
      signal,
    )
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<DataResponse<CashSession>>(
      endpoints.cashSessions.detail(id),
      signal,
    )
  },
  open(input: CashSessionOpenInput) {
    return api.post<DataResponse<CashSession>>(
      endpoints.cashSessions.open,
      input,
    )
  },
  close(id: string, input: CashSessionCloseInput) {
    return api.post<DataResponse<CashSession>>(
      endpoints.cashSessions.close(id),
      input,
    )
  },
}
