import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import { computeStock } from '../inventory/inventory.rules.js'
import type { MovementType } from '../inventory/inventory.types.js'
import { daysBetween, toISODate } from './replenishment.rules.js'
import { REPLENISHMENT_RUN_CODE_PREFIX } from './replenishment.types.js'
import type {
  ReplenishmentInputs,
  ReplenishmentNotEligibleReason,
  ReplenishmentPriority,
  ReplenishmentRecommendation,
  ReplenishmentRunCreateInput,
  ReplenishmentRunDetailFilters,
  ReplenishmentRunHistoryFilters,
  ReplenishmentRunSummary,
} from './replenishment.types.js'

const runSelect = {
  id: true,
  code: true,
  strategyVersion: true,
  fromDate: true,
  toDate: true,
  coverageTargetDays: true,
  actorName: true,
  executedAt: true,
  eligibleCount: true,
  suggestedTotal: true,
  _count: { select: { recommendations: true } },
} satisfies Prisma.ReplenishmentRunSelect

const recommendationSelect = {
  productCode: true,
  productName: true,
  unitLabel: true,
  eligible: true,
  reason: true,
  strategyVersion: true,
  stockCurrent: true,
  minimumStock: true,
  demandQuantity: true,
  demandPoints: true,
  periodDays: true,
  dailyDemand: true,
  coverageTargetDays: true,
  targetStock: true,
  suggestedQuantity: true,
  currentCoverageDays: true,
  priority: true,
  explanation: true,
} satisfies Prisma.ReplenishmentRecommendationSelect

type RunRow = Prisma.ReplenishmentRunGetPayload<{
  select: typeof runSelect
}>

type RecommendationRow = Prisma.ReplenishmentRecommendationGetPayload<{
  select: typeof recommendationSelect
}>

function dayRange(from: string, to: string): { gte: Date; lte: Date } {
  return {
    gte: new Date(`${from}T00:00:00.000Z`),
    lte: new Date(`${to}T23:59:59.999Z`),
  }
}

function toRecommendation(row: RecommendationRow): ReplenishmentRecommendation {
  return {
    code: row.productCode,
    name: row.productName,
    unitLabel: row.unitLabel,
    eligible: row.eligible,
    reason: row.reason as ReplenishmentNotEligibleReason | null,
    strategyVersion: row.strategyVersion,
    stockCurrent: row.stockCurrent === null ? null : Number(row.stockCurrent),
    minimumStock: row.minimumStock === null ? null : Number(row.minimumStock),
    demandQuantity: Number(row.demandQuantity),
    demandPoints: row.demandPoints,
    periodDays: row.periodDays,
    dailyDemand: row.dailyDemand === null ? null : Number(row.dailyDemand),
    coverageTargetDays: row.coverageTargetDays,
    targetStock: row.targetStock === null ? null : Number(row.targetStock),
    suggestedQuantity:
      row.suggestedQuantity === null ? null : Number(row.suggestedQuantity),
    currentCoverageDays:
      row.currentCoverageDays === null ? null : Number(row.currentCoverageDays),
    priority: row.priority as ReplenishmentPriority | null,
    explanation: row.explanation,
  }
}

function toRunSummary(run: RunRow): ReplenishmentRunSummary {
  return {
    code: run.code,
    strategyVersion: run.strategyVersion,
    period: { from: toISODate(run.fromDate), to: toISODate(run.toDate) },
    periodDays: daysBetween(toISODate(run.fromDate), toISODate(run.toDate)),
    coverageTargetDays: run.coverageTargetDays,
    actorName: run.actorName,
    executedAt: run.executedAt.toISOString(),
    eligibleCount: run.eligibleCount,
    suggestedTotal: Number(run.suggestedTotal),
    recommendationCount: run._count.recommendations,
  }
}

async function nextCode(
  transaction: Prisma.TransactionClient,
): Promise<string> {
  const rows = await transaction.$queryRaw<
    Array<{ seq: number | string }>
  >`SELECT nextval('"replenishment_runs_code_seq"') AS seq`
  return `${REPLENISHMENT_RUN_CODE_PREFIX}-${String(Number(rows[0].seq)).padStart(6, '0')}`
}

function buildHistoryWhere(
  filters: ReplenishmentRunHistoryFilters,
): Prisma.ReplenishmentRunWhereInput {
  if (!filters.from && !filters.to) return {}
  return {
    executedAt: {
      ...(filters.from
        ? { gte: new Date(`${filters.from}T00:00:00.000Z`) }
        : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
    },
  }
}

export const replenishmentRepository = {
  async loadInputs(period: {
    from: string
    to: string
  }): Promise<ReplenishmentInputs> {
    return databaseService.transaction(async (transaction) => {
      const range = dayRange(period.from, period.to)
      const [products, stockGroups, saleDemand, consumptionDemand] =
        await Promise.all([
          transaction.product.findMany({
            select: {
              id: true,
              code: true,
              name: true,
              minimumStock: true,
              active: true,
              unit: { select: { symbol: true } },
            },
            orderBy: { name: 'asc' },
          }),
          transaction.inventoryMovement.groupBy({
            by: ['productId', 'type'],
            where: { status: 'CONFIRMED' },
            _sum: { quantity: true },
          }),
          transaction.saleLine.groupBy({
            by: ['productId'],
            where: {
              type: 'PRODUCT',
              productId: { not: null },
              sale: {
                is: {
                  status: 'CONFIRMED',
                  confirmedAt: range,
                },
              },
            },
            _sum: { quantity: true },
            _count: { _all: true },
          }),
          transaction.workOrderConsumption.groupBy({
            by: ['productId'],
            where: {
              type: 'CONSUMPTION',
              occurredAt: range,
              inventoryMovement: { is: { status: 'CONFIRMED' } },
            },
            _sum: { quantity: true },
            _count: { _all: true },
          }),
        ])

      const stockByProduct = new Map<
        string,
        Array<{ type: MovementType; quantity: unknown }>
      >()
      for (const item of stockGroups) {
        const list = stockByProduct.get(item.productId) ?? []
        list.push({ type: item.type, quantity: item._sum.quantity ?? 0 })
        stockByProduct.set(item.productId, list)
      }

      const demandByProduct = new Map<
        string,
        { quantity: number; points: number }
      >()
      for (const item of saleDemand) {
        if (!item.productId) continue
        demandByProduct.set(item.productId, {
          quantity: Number(item._sum.quantity ?? 0),
          points: item._count._all,
        })
      }
      for (const item of consumptionDemand) {
        const current = demandByProduct.get(item.productId) ?? {
          quantity: 0,
          points: 0,
        }
        demandByProduct.set(item.productId, {
          quantity: current.quantity + Number(item._sum.quantity ?? 0),
          points: current.points + item._count._all,
        })
      }

      return {
        products: products.map((product) => ({
          id: product.id,
          code: product.code,
          name: product.name,
          minimumStock: Number(product.minimumStock),
          active: product.active,
          unitLabel: product.unit.symbol,
        })),
        stock: products.map((product) => ({
          productId: product.id,
          stock: computeStock(stockByProduct.get(product.id) ?? []),
        })),
        demand: [...demandByProduct.entries()].map(([productId, detail]) => ({
          productId,
          quantity: detail.quantity,
          points: detail.points,
        })),
      }
    })
  },

  async createRun(
    input: ReplenishmentRunCreateInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<{ run: ReplenishmentRunSummary; replayed: boolean }> {
    return databaseService.transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:replenishment:runs`}))`

      if (input.idempotencyKey) {
        const existing = await transaction.replenishmentRun.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: runSelect,
        })
        if (existing) return { run: toRunSummary(existing), replayed: true }
      }

      const code = await nextCode(transaction)
      const run = await transaction.replenishmentRun.create({
        data: {
          code,
          strategyVersion: input.strategyVersion,
          fromDate: new Date(`${input.period.from}T00:00:00.000Z`),
          toDate: new Date(`${input.period.to}T00:00:00.000Z`),
          coverageTargetDays: input.coverageTargetDays,
          actorId: actor.id,
          actorName: actor.name.slice(0, 80),
          idempotencyKey: input.idempotencyKey,
          eligibleCount: input.eligibleCount,
          suggestedTotal: input.suggestedTotal,
        },
        select: runSelect,
      })

      await transaction.replenishmentRecommendation.createMany({
        data: input.recommendations.map((item) => ({
          runId: run.id,
          productId: item.productId,
          productCode: item.code,
          productName: item.name,
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
          sortOrder: item.sortOrder,
        })),
      })

      await transaction.auditLog.create({
        data: {
          event: 'REPLENISHMENT_RUN_EXECUTED',
          userId: actor.id,
          identifier: code,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          metadata: {
            runId: run.id,
            strategyVersion: input.strategyVersion,
            fromDate: input.period.from,
            toDate: input.period.to,
            coverageTargetDays: input.coverageTargetDays,
            eligibleCount: input.eligibleCount,
            suggestedTotal: input.suggestedTotal,
          },
        },
      })

      return { run: toRunSummary(run), replayed: false }
    })
  },

  async listRuns(filters: ReplenishmentRunHistoryFilters): Promise<{
    items: ReplenishmentRunSummary[]
    total: number
  }> {
    return databaseService.transaction(async (transaction) => {
      const where = buildHistoryWhere(filters)
      const [runs, total] = await Promise.all([
        transaction.replenishmentRun.findMany({
          select: runSelect,
          where,
          orderBy: [{ executedAt: 'desc' }, { code: 'desc' }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.replenishmentRun.count({ where }),
      ])
      return { items: runs.map(toRunSummary), total }
    })
  },

  async loadRunDetail(
    code: string,
    filters: ReplenishmentRunDetailFilters,
  ): Promise<{
    run: ReplenishmentRunSummary
    items: ReplenishmentRecommendation[]
    total: number
  }> {
    return databaseService.transaction(async (transaction) => {
      const run = await transaction.replenishmentRun.findUnique({
        where: { code },
        select: runSelect,
      })
      if (!run) {
        throw new AppError(
          404,
          'REPLENISHMENT_RUN_NOT_FOUND',
          'La corrida de reabastecimiento no existe.',
        )
      }

      const where = {
        runId: run.id,
        ...(filters.search
          ? {
              OR: [
                {
                  productName: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
                {
                  productCode: {
                    contains: filters.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.eligible === null ? {} : { eligible: filters.eligible }),
      } satisfies Prisma.ReplenishmentRecommendationWhereInput

      const [rows, total] = await Promise.all([
        transaction.replenishmentRecommendation.findMany({
          select: recommendationSelect,
          where,
          orderBy: { sortOrder: 'asc' },
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize,
        }),
        transaction.replenishmentRecommendation.count({ where }),
      ])

      return {
        run: toRunSummary(run),
        items: rows.map(toRecommendation),
        total,
      }
    })
  },
}
