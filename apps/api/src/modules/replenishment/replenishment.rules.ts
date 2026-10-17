import { AppError } from '../../shared/errors/app-error.js'
import {
  REPLENISHMENT_MAX_COVERAGE_DAYS,
  REPLENISHMENT_MIN_COVERAGE_DAYS,
  REPLENISHMENT_DEFAULT_COVERAGE_DAYS,
  REPLENISHMENT_MIN_DEMAND_POINTS,
  REPLENISHMENT_STRATEGY_VERSION,
} from './replenishment.types.js'

const DEFAULT_PERIOD_DAYS = 30

const PRIORITY_LABELS: Record<string, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
}

const PRIORITY_RANK: Record<string, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  BAJA: 3,
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDaysISO(value: string, days: number): string {
  const date = parseISODate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return toISODate(date)
}

export function resolveReplenishmentPeriod(
  from: string | null | undefined,
  to: string | null | undefined,
): { from: string; to: string } {
  const normalizedFrom = from?.trim() || null
  const normalizedTo = to?.trim() || null
  const finalTo = normalizedTo ?? todayISO()
  const finalFrom = normalizedFrom ?? addDaysISO(finalTo, -DEFAULT_PERIOD_DAYS)
  if (finalFrom > finalTo) {
    throw new AppError(
      400,
      'REPLENISHMENT_DATE_RANGE_INVALID',
      'La fecha inicial no puede ser posterior a la fecha final.',
    )
  }
  return { from: finalFrom, to: finalTo }
}

export function daysBetween(from: string, to: string): number {
  const start = parseISODate(from).getTime()
  const end = parseISODate(to).getTime()
  return Math.round((end - start) / 86_400_000) + 1
}

export function assertCoverageTargetDays(value: number): number {
  if (
    !Number.isInteger(value) ||
    value < REPLENISHMENT_MIN_COVERAGE_DAYS ||
    value > REPLENISHMENT_MAX_COVERAGE_DAYS
  ) {
    throw new AppError(
      400,
      'REPLENISHMENT_COVERAGE_INVALID',
      `La cobertura objetivo debe estar entre ${REPLENISHMENT_MIN_COVERAGE_DAYS} y ${REPLENISHMENT_MAX_COVERAGE_DAYS} días.`,
    )
  }
  return value
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function roundQuantity(value: number): number {
  return round(value, 3)
}

export function roundDailyDemand(value: number): number {
  return round(value, 6)
}

export function roundCoverage(value: number): number {
  return round(value, 1)
}

function ceilUnit(value: number): number {
  const rounded = Math.round(value * 1000) / 1000
  return Math.max(0, Math.ceil(rounded))
}

export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority
}

export function defaultCoverageTargetDays(): number {
  return REPLENISHMENT_DEFAULT_COVERAGE_DAYS
}

export interface ReplenishmentComputeInput {
  code: string
  name: string
  unitLabel: string | null
  active: boolean
  stockCurrent: number
  minimumStock: number
  demandQuantity: number
  demandPoints: number
  periodDays: number
  coverageTargetDays: number
}

function resolvePriority(params: {
  stockCurrent: number
  minimumStock: number
  currentCoverageDays: number
  coverageTargetDays: number
  suggestedQuantity: number
}): 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA' {
  if (params.stockCurrent <= params.minimumStock) return 'CRITICA'
  if (params.currentCoverageDays < params.coverageTargetDays * 0.5)
    return 'ALTA'
  if (params.suggestedQuantity > 0) return 'MEDIA'
  return 'BAJA'
}

function priorityReason(params: {
  stockCurrent: number
  minimumStock: number
  currentCoverageDays: number
  coverageTargetDays: number
  targetStock: number
  suggestedQuantity: number
}): string {
  if (params.stockCurrent <= params.minimumStock) {
    return `el stock actual ${params.stockCurrent} no supera el mínimo de ${params.minimumStock}`
  }
  if (params.currentCoverageDays < params.coverageTargetDays * 0.5) {
    return `la cobertura actual de ${params.currentCoverageDays} días es menor a la mitad de la cobertura objetivo de ${params.coverageTargetDays} días`
  }
  if (params.suggestedQuantity > 0) {
    return `el stock actual ${params.stockCurrent} está por debajo del stock objetivo de ${params.targetStock}`
  }
  return `el stock actual ${params.stockCurrent} ya cubre el stock objetivo de ${params.targetStock}`
}

export function computeReplenishmentRecommendation(
  input: ReplenishmentComputeInput,
) {
  const periodDays = input.periodDays
  const coverageTargetDays = input.coverageTargetDays
  const demandQuantity = roundQuantity(input.demandQuantity)
  const stockCurrent = roundQuantity(input.stockCurrent)
  const minimumStock = roundQuantity(input.minimumStock)
  const demandPoints = input.demandPoints

  const base = {
    code: input.code,
    name: input.name,
    unitLabel: input.unitLabel,
    strategyVersion: REPLENISHMENT_STRATEGY_VERSION,
    stockCurrent,
    minimumStock,
    demandQuantity,
    demandPoints,
    periodDays,
    coverageTargetDays,
  }

  const withoutSuggestion = {
    dailyDemand: null,
    targetStock: null,
    suggestedQuantity: null,
    currentCoverageDays: null,
    priority: null,
  }

  if (!input.active) {
    return {
      ...base,
      ...withoutSuggestion,
      eligible: false,
      reason: 'INACTIVE_PRODUCT' as const,
      explanation:
        'Producto inactivo: no se genera recomendación aunque conserve stock o demanda histórica.',
    }
  }

  if (demandQuantity <= 0 || demandPoints < REPLENISHMENT_MIN_DEMAND_POINTS) {
    return {
      ...base,
      ...withoutSuggestion,
      eligible: false,
      reason: 'INSUFFICIENT_DATA' as const,
      explanation:
        demandQuantity <= 0
          ? 'Sin demanda confirmada en el período: no hay ventas ni consumos de productos que permitan calcular una recomendación.'
          : `Solo ${demandPoints} registro(s) de demanda confirmada en el período; se requieren al menos ${REPLENISHMENT_MIN_DEMAND_POINTS} para calcular una recomendación.`,
    }
  }

  const dailyDemand = roundDailyDemand(demandQuantity / periodDays)
  const targetStock = roundQuantity(dailyDemand * coverageTargetDays)
  const suggestedQuantity = ceilUnit(targetStock - stockCurrent)
  const currentCoverageDays = roundCoverage(stockCurrent / dailyDemand)
  const priority = resolvePriority({
    stockCurrent,
    minimumStock,
    currentCoverageDays,
    coverageTargetDays,
    suggestedQuantity,
  })

  const explanation = [
    `${demandPoints} registro(s) de demanda confirmada suman ${demandQuantity} en ${periodDays} días.`,
    `Demanda diaria = demanda ÷ días = ${dailyDemand}.`,
    `Stock objetivo = demanda diaria × cobertura (${coverageTargetDays} días) = ${targetStock}.`,
    `Cantidad sugerida = techo(${targetStock} − stock actual ${stockCurrent}) = ${suggestedQuantity}.`,
    `Prioridad ${priorityLabel(priority)}: ${priorityReason({
      stockCurrent,
      minimumStock,
      currentCoverageDays,
      coverageTargetDays,
      targetStock,
      suggestedQuantity,
    })}.`,
  ].join(' ')

  return {
    ...base,
    ...withoutSuggestion,
    eligible: true,
    reason: null,
    dailyDemand,
    targetStock,
    suggestedQuantity,
    currentCoverageDays,
    priority,
    explanation,
  }
}

export interface ReplenishmentComparable {
  eligible: boolean
  priority: string | null
  suggestedQuantity: number | null
  name: string
}

export function compareReplenishmentRecommendations(
  a: ReplenishmentComparable,
  b: ReplenishmentComparable,
): number {
  if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
  if (a.eligible) {
    const rankA = a.priority ? (PRIORITY_RANK[a.priority] ?? 99) : 99
    const rankB = b.priority ? (PRIORITY_RANK[b.priority] ?? 99) : 99
    if (rankA !== rankB) return rankA - rankB
    const suggestedA = a.suggestedQuantity ?? 0
    const suggestedB = b.suggestedQuantity ?? 0
    if (suggestedA !== suggestedB) return suggestedB - suggestedA
  }
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}
