import type { RequestContext } from '../auth/auth.types.js'
import { replenishmentRepository } from './replenishment.repository.js'
import {
  assertCoverageTargetDays,
  compareReplenishmentRecommendations,
  computeReplenishmentRecommendation,
  daysBetween,
  resolveReplenishmentPeriod,
  roundQuantity,
} from './replenishment.rules.js'
import {
  REPLENISHMENT_MIN_DEMAND_POINTS,
  REPLENISHMENT_STRATEGY_VERSION,
} from './replenishment.types.js'
import type {
  ReplenishmentComputedRecommendation,
  ReplenishmentCounts,
  ReplenishmentEligibility,
  ReplenishmentEligibilityFilters,
  ReplenishmentPagination,
  ReplenishmentPriority,
  ReplenishmentRecommendation,
  ReplenishmentRunDetail,
  ReplenishmentRunDetailFilters,
  ReplenishmentRunHistoryFilters,
  ReplenishmentRunInput,
  ReplenishmentRunSummary,
} from './replenishment.types.js'

function paginate(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

function buildCounts(
  items: readonly ReplenishmentRecommendation[],
): ReplenishmentCounts {
  const counts: ReplenishmentCounts = {
    total: items.length,
    eligible: 0,
    notEligible: 0,
    critical: 0,
    advisable: 0,
  }
  for (const item of items) {
    if (!item.eligible) {
      counts.notEligible += 1
      continue
    }
    counts.eligible += 1
    if (item.priority === 'CRITICA') counts.critical += 1
    if (item.priority === 'ALTA') counts.advisable += 1
  }
  return counts
}

function matchesFilters(
  item: ReplenishmentRecommendation,
  filters: {
    search: string | null
    priority: ReplenishmentPriority | null
    eligible: boolean | null
  },
): boolean {
  if (filters.search) {
    const search = filters.search.toLowerCase()
    const matches =
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search)
    if (!matches) return false
  }
  if (filters.priority && item.priority !== filters.priority) return false
  if (filters.eligible !== null && item.eligible !== filters.eligible)
    return false
  return true
}

function toComputed(
  inputs: {
    products: Array<{
      id: string
      code: string
      name: string
      unitLabel: string | null
      active: boolean
      minimumStock: number
    }>
    stock: Array<{ productId: string; stock: number }>
    demand: Array<{ productId: string; quantity: number; points: number }>
  },
  periodDays: number,
  coverageTargetDays: number,
): ReplenishmentComputedRecommendation[] {
  const stockByProduct = new Map(
    inputs.stock.map((row) => [row.productId, row.stock]),
  )
  const demandByProduct = new Map(
    inputs.demand.map((row) => [row.productId, row]),
  )

  return inputs.products
    .map((product) => {
      const demand = demandByProduct.get(product.id)
      const computed = computeReplenishmentRecommendation({
        code: product.code,
        name: product.name,
        unitLabel: product.unitLabel,
        active: product.active,
        stockCurrent: stockByProduct.get(product.id) ?? 0,
        minimumStock: product.minimumStock,
        demandQuantity: demand?.quantity ?? 0,
        demandPoints: demand?.points ?? 0,
        periodDays,
        coverageTargetDays,
      })
      return { ...computed, productId: product.id, sortOrder: 0 }
    })
    .sort(compareReplenishmentRecommendations)
    .map((item, index) => ({ ...item, sortOrder: index }))
}

function toPublicRecommendation(
  item: ReplenishmentComputedRecommendation,
): ReplenishmentRecommendation {
  return {
    code: item.code,
    name: item.name,
    unitLabel: item.unitLabel,
    eligible: item.eligible,
    reason: item.reason,
    strategyVersion: item.strategyVersion,
    stockCurrent: item.stockCurrent,
    minimumStock: item.minimumStock,
    demandQuantity: item.demandQuantity,
    demandPoints: item.demandPoints,
    periodDays: item.periodDays,
    dailyDemand: item.dailyDemand,
    coverageTargetDays: item.coverageTargetDays,
    targetStock: item.targetStock,
    suggestedQuantity: item.suggestedQuantity,
    currentCoverageDays: item.currentCoverageDays,
    priority: item.priority,
    explanation: item.explanation,
  }
}

export const replenishmentService = {
  async getEligibility(
    filters: ReplenishmentEligibilityFilters,
  ): Promise<ReplenishmentEligibility> {
    const period = resolveReplenishmentPeriod(filters.from, filters.to)
    const coverageTargetDays = assertCoverageTargetDays(filters.coverageDays)
    const periodDays = daysBetween(period.from, period.to)

    const inputs = await replenishmentRepository.loadInputs(period)
    const all = toComputed(inputs, periodDays, coverageTargetDays)
    const filtered = all
      .filter((item) => matchesFilters(item, filters))
      .map(toPublicRecommendation)

    return {
      period,
      periodDays,
      coverageTargetDays,
      strategyVersion: REPLENISHMENT_STRATEGY_VERSION,
      minDemandPoints: REPLENISHMENT_MIN_DEMAND_POINTS,
      counts: buildCounts(all),
      items: filtered.slice(
        (filters.page - 1) * filters.pageSize,
        filters.page * filters.pageSize,
      ),
      pagination: paginate(filtered.length, filters.page, filters.pageSize),
    }
  },

  async executeRun(
    input: ReplenishmentRunInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<{ run: ReplenishmentRunSummary; replayed: boolean }> {
    const period = resolveReplenishmentPeriod(input.from, input.to)
    const coverageTargetDays = assertCoverageTargetDays(input.coverageDays)
    const periodDays = daysBetween(period.from, period.to)

    const inputs = await replenishmentRepository.loadInputs(period)
    const recommendations = toComputed(inputs, periodDays, coverageTargetDays)

    return replenishmentRepository.createRun(
      {
        strategyVersion: REPLENISHMENT_STRATEGY_VERSION,
        period,
        coverageTargetDays,
        idempotencyKey: input.idempotencyKey,
        eligibleCount: recommendations.filter((item) => item.eligible).length,
        suggestedTotal: roundQuantity(
          recommendations.reduce(
            (sum, item) => sum + (item.suggestedQuantity ?? 0),
            0,
          ),
        ),
        recommendations,
      },
      actor,
      context,
    )
  },

  async listRuns(filters: ReplenishmentRunHistoryFilters): Promise<{
    items: ReplenishmentRunSummary[]
    pagination: ReplenishmentPagination
  }> {
    const { items, total } = await replenishmentRepository.listRuns(filters)
    return {
      items,
      pagination: paginate(total, filters.page, filters.pageSize),
    }
  },

  async getRunDetail(
    code: string,
    filters: ReplenishmentRunDetailFilters,
  ): Promise<ReplenishmentRunDetail> {
    const { run, items, total } = await replenishmentRepository.loadRunDetail(
      code,
      filters,
    )
    return {
      run,
      items,
      pagination: paginate(total, filters.page, filters.pageSize),
    }
  },
}
