import { api } from '@/infrastructure/api/client'
import { endpoints } from '@/infrastructure/api/endpoints'
import type {
  EligibilityFilters,
  ReplenishmentEligibility,
  ReplenishmentPriority,
  ReplenishmentRunDetail,
  ReplenishmentRunList,
  ReplenishmentRunSummary,
  RunDetailFilters,
  RunHistoryFilters,
  RunInput,
} from '../types/replenishment.types'

function buildEligibilityQuery(filters: EligibilityFilters) {
  const query = new URLSearchParams({
    coverageDays: String(filters.coverageDays),
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  const search = filters.search.trim()
  if (search) query.set('search', search)
  if (filters.priority) query.set('priority', filters.priority)
  if (filters.eligible) query.set('eligible', filters.eligible)
  return query.toString()
}

function buildRunHistoryQuery(filters: RunHistoryFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  if (filters.from) query.set('from', filters.from)
  if (filters.to) query.set('to', filters.to)
  return query.toString()
}

function buildRunDetailQuery(filters: RunDetailFilters) {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  })
  const search = filters.search.trim()
  if (search) query.set('search', search)
  if (filters.priority) query.set('priority', filters.priority)
  if (filters.eligible) query.set('eligible', filters.eligible)
  return query.toString()
}

export const replenishmentService = {
  getEligibility(filters: EligibilityFilters, signal?: AbortSignal) {
    return api.get<ReplenishmentEligibility>(
      `${endpoints.replenishment.eligibility}?${buildEligibilityQuery(filters)}`,
      signal,
    )
  },
  createRun(input: RunInput) {
    return api.post<ReplenishmentRunSummary>(
      endpoints.replenishment.runs,
      input,
    )
  },
  listRuns(filters: RunHistoryFilters, signal?: AbortSignal) {
    return api.get<ReplenishmentRunList>(
      `${endpoints.replenishment.runs}?${buildRunHistoryQuery(filters)}`,
      signal,
    )
  },
  getRunDetail(code: string, filters: RunDetailFilters, signal?: AbortSignal) {
    return api.get<ReplenishmentRunDetail>(
      `${endpoints.replenishment.run(code)}?${buildRunDetailQuery(filters)}`,
      signal,
    )
  },
}

export function priorityOptions(): Array<{
  value: ReplenishmentPriority | ''
  label: string
}> {
  return [
    { value: '', label: 'Todas las prioridades' },
    { value: 'CRITICA', label: 'Crítica' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'BAJA', label: 'Baja' },
  ]
}

export function eligibilityOptions(): Array<{
  value: '' | 'true' | 'false'
  label: string
}> {
  return [
    { value: '', label: 'Todos los productos' },
    { value: 'true', label: 'Solo elegibles' },
    { value: 'false', label: 'Solo no elegibles' },
  ]
}
