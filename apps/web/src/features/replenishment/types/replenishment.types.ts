export type ReplenishmentPriority = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'

export type ReplenishmentReason = 'INACTIVE_PRODUCT' | 'INSUFFICIENT_DATA'

export interface ReplenishmentPeriod {
  from: string
  to: string
}

export interface ReplenishmentPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ReplenishmentRecommendation {
  code: string
  name: string
  unitLabel: string | null
  eligible: boolean
  reason: ReplenishmentReason | null
  strategyVersion: string
  stockCurrent: number | null
  minimumStock: number | null
  demandQuantity: number
  demandPoints: number
  periodDays: number
  dailyDemand: number | null
  coverageTargetDays: number
  targetStock: number | null
  suggestedQuantity: number | null
  currentCoverageDays: number | null
  priority: ReplenishmentPriority | null
  explanation: string
}

export interface ReplenishmentCounts {
  total: number
  eligible: number
  notEligible: number
  critical: number
  advisable: number
}

export interface ReplenishmentEligibility {
  period: ReplenishmentPeriod
  periodDays: number
  coverageTargetDays: number
  strategyVersion: string
  minDemandPoints: number
  counts: ReplenishmentCounts
  items: ReplenishmentRecommendation[]
  pagination: ReplenishmentPagination
}

export interface ReplenishmentRunSummary {
  code: string
  strategyVersion: string
  period: ReplenishmentPeriod
  periodDays: number
  coverageTargetDays: number
  actorName: string
  executedAt: string
  eligibleCount: number
  suggestedTotal: number
  recommendationCount: number
}

export interface ReplenishmentRunList {
  items: ReplenishmentRunSummary[]
  pagination: ReplenishmentPagination
}

export interface ReplenishmentRunDetail {
  run: ReplenishmentRunSummary
  items: ReplenishmentRecommendation[]
  pagination: ReplenishmentPagination
}

export interface EligibilityFilters {
  from: string
  to: string
  coverageDays: number
  search: string
  priority: ReplenishmentPriority | ''
  eligible: '' | 'true' | 'false'
  page: number
  pageSize: number
}

export interface RunHistoryFilters {
  from: string
  to: string
  page: number
  pageSize: number
}

export interface RunDetailFilters {
  search: string
  priority: ReplenishmentPriority | ''
  eligible: '' | 'true' | 'false'
  page: number
  pageSize: number
}

export interface RunInput {
  from: string
  to: string
  coverageDays: number
  idempotencyKey: string
}
