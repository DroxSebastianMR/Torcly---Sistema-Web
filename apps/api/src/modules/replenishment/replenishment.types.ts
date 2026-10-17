export const REPLENISHMENT_STRATEGY = 'net-confirmed-demand-v1'
export const REPLENISHMENT_STRATEGY_VERSION = 'v1'
export const REPLENISHMENT_DEFAULT_COVERAGE_DAYS = 30
export const REPLENISHMENT_MIN_COVERAGE_DAYS = 1
export const REPLENISHMENT_MAX_COVERAGE_DAYS = 365
export const REPLENISHMENT_MIN_DEMAND_POINTS = 3
export const REPLENISHMENT_RUN_CODE_PREFIX = 'RAB'

export const REPLENISHMENT_PRIORITIES = [
  'CRITICA',
  'ALTA',
  'MEDIA',
  'BAJA',
] as const

export type ReplenishmentPriority = (typeof REPLENISHMENT_PRIORITIES)[number]

export const REPLENISHMENT_NOT_ELIGIBLE_REASONS = [
  'INACTIVE_PRODUCT',
  'INSUFFICIENT_DATA',
] as const

export type ReplenishmentNotEligibleReason =
  (typeof REPLENISHMENT_NOT_ELIGIBLE_REASONS)[number]

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
  reason: ReplenishmentNotEligibleReason | null
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

export interface ReplenishmentComputedRecommendation
  extends ReplenishmentRecommendation {
  productId: string
  sortOrder: number
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

export interface ReplenishmentRunDetail {
  run: ReplenishmentRunSummary
  items: ReplenishmentRecommendation[]
  pagination: ReplenishmentPagination
}

export interface ReplenishmentPeriodInput {
  from: string | null
  to: string | null
}

export interface ReplenishmentEligibilityFilters
  extends ReplenishmentPeriodInput {
  coverageDays: number
  search: string | null
  priority: ReplenishmentPriority | null
  eligible: boolean | null
  page: number
  pageSize: number
}

export interface ReplenishmentRunInput extends ReplenishmentPeriodInput {
  coverageDays: number
  idempotencyKey: string | null
}

export interface ReplenishmentRunHistoryFilters {
  from: string | null
  to: string | null
  page: number
  pageSize: number
}

export interface ReplenishmentRunDetailFilters {
  search: string | null
  priority: ReplenishmentPriority | null
  eligible: boolean | null
  page: number
  pageSize: number
}

export interface ReplenishmentProductRow {
  id: string
  code: string
  name: string
  minimumStock: number
  active: boolean
  unitLabel: string | null
}

export interface ReplenishmentStockRow {
  productId: string
  stock: number
}

export interface ReplenishmentDemandRow {
  productId: string
  quantity: number
  points: number
}

export interface ReplenishmentInputs {
  products: ReplenishmentProductRow[]
  stock: ReplenishmentStockRow[]
  demand: ReplenishmentDemandRow[]
}

export interface ReplenishmentRunCreateInput {
  strategyVersion: string
  period: ReplenishmentPeriod
  coverageTargetDays: number
  idempotencyKey: string | null
  eligibleCount: number
  suggestedTotal: number
  recommendations: ReplenishmentComputedRecommendation[]
}
