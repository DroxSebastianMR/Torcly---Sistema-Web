import { computeStock } from '../inventory/inventory.rules.js'
import { WORK_ORDER_STATUSES } from '../operations/operations.types.js'
import type { PaymentCollectionStatus } from '../operations/operations.types.js'
import {
  collectionStatusFromBalance,
  computeBalance,
  computePaidAmount,
  roundMoney,
} from '../payments/payment.rules.js'
import { MOVEMENT_TYPES } from './reports.types.js'
import type {
  ReportBlock,
  ReportBlockData,
  ReportGranularity,
  ReportPeriod,
  ReportSummary,
  ReportTrendPoint,
} from './reports.types.js'
import { reportsRepository } from './reports.repository.js'
import type {
  MovementTrendRow,
  PaymentTrendRow,
  ServiceLineRow,
} from './reports.repository.js'
import {
  assertBlockAccess,
  authorizedBlocks,
  BLOCK_DESCRIPTORS,
  buildBuckets,
  bucketKey,
  resolveGranularity,
  resolvePeriod,
} from './reports.rules.js'

function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

function sumAmount(amounts: readonly number[]): number {
  return roundMoney(amounts.reduce((sum, amount) => sum + amount, 0))
}

function buildTrend<TRow>(
  rows: readonly TRow[],
  toPoint: (row: TRow) => { date: Date; count: number; amount: number },
  buckets: Array<{ key: string; label: string }>,
  granularity: ReportGranularity,
): ReportTrendPoint[] {
  const totals = new Map<string, { count: number; amount: number }>()
  for (const row of rows) {
    const point = toPoint(row)
    const key = bucketKey(point.date, granularity)
    const slot = totals.get(key) ?? { count: 0, amount: 0 }
    slot.count += point.count
    slot.amount += point.amount
    totals.set(key, slot)
  }
  return buckets.map((bucket) => {
    const slot = totals.get(bucket.key)
    return {
      bucket: bucket.key,
      label: bucket.label,
      count: slot?.count ?? 0,
      amount: roundMoney(slot?.amount ?? 0),
    }
  })
}

function emptyTrend(
  buckets: Array<{ key: string; label: string }>,
): ReportTrendPoint[] {
  return buckets.map((bucket) => ({
    bucket: bucket.key,
    label: bucket.label,
    count: 0,
    amount: 0,
  }))
}

async function buildSalesBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<Extract<ReportBlockData, { block: 'sales' }>> {
  const [salesRows, lines] = await Promise.all([
    reportsRepository.listSalesInPeriod(period.from, period.to),
    reportsRepository.listSaleLinesInPeriod(period.from, period.to),
  ])
  const count = salesRows.length
  const amount = sumAmount(salesRows.map((row) => row.total))
  const buckets = buildBuckets(period.from, period.to, granularity)
  return {
    block: 'sales',
    descriptor: BLOCK_DESCRIPTORS.sales,
    period,
    granularity,
    metrics: {
      count,
      amount,
      averageTicket: count > 0 ? roundMoney(amount / count) : 0,
    },
    trend: buildTrend(
      salesRows,
      (row) => ({ date: row.confirmedAt, count: 1, amount: row.total }),
      buckets,
      granularity,
    ),
    composition: lines.slice(0, 10),
  }
}

async function buildPaymentsBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<Extract<ReportBlockData, { block: 'payments' }>> {
  const [paymentRows, obligations] = await Promise.all([
    reportsRepository.listPaymentsInPeriod(period.from, period.to),
    reportsRepository.listPendingObligations(),
  ])
  const grossCollected = sumAmount(
    paymentRows
      .filter((row) => row.type === 'PAYMENT')
      .map((row) => row.amount),
  )
  const compensated = sumAmount(
    paymentRows
      .filter((row) => row.type === 'COMPENSATION')
      .map((row) => row.amount),
  )
  const buckets = buildBuckets(period.from, period.to, granularity)
  const byStatus: Record<
    PaymentCollectionStatus,
    { count: number; amount: number }
  > = {
    PENDING: { count: 0, amount: 0 },
    PARTIALLY_PAID: { count: 0, amount: 0 },
    PAID: { count: 0, amount: 0 },
  }
  for (const obligation of obligations) {
    const paid = computePaidAmount(obligation.payments)
    const balance = computeBalance(obligation.total, paid)
    const status = collectionStatusFromBalance(paid, balance)
    byStatus[status].count += 1
    if (balance > 0) byStatus[status].amount += balance
  }
  byStatus.PARTIALLY_PAID.amount = roundMoney(byStatus.PARTIALLY_PAID.amount)
  byStatus.PENDING.amount = roundMoney(byStatus.PENDING.amount)
  byStatus.PAID.amount = roundMoney(byStatus.PAID.amount)
  return {
    block: 'payments',
    descriptor: BLOCK_DESCRIPTORS.payments,
    period,
    granularity,
    metrics: {
      grossCollected,
      compensated,
      netCollected: roundMoney(grossCollected - compensated),
      paymentCount: paymentRows.filter((row) => row.type === 'PAYMENT').length,
      pendingCount: byStatus.PENDING.count + byStatus.PARTIALLY_PAID.count,
      pendingAmount: roundMoney(
        byStatus.PENDING.amount + byStatus.PARTIALLY_PAID.amount,
      ),
      byStatus,
    },
    trend: buildTrend(
      paymentRows,
      (row: PaymentTrendRow) => ({
        date: row.occurredAt,
        count: 1,
        amount: row.type === 'PAYMENT' ? row.amount : -row.amount,
      }),
      buckets,
      granularity,
    ),
  }
}

async function buildInventoryBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<Extract<ReportBlockData, { block: 'inventory' }>> {
  const [movementRows, lowStock] = await Promise.all([
    reportsRepository.listMovementsInPeriod(period.from, period.to),
    reportsRepository.listLowStockProducts(),
  ])
  const byType = Object.fromEntries(
    MOVEMENT_TYPES.map((type) => [type, 0]),
  ) as Record<(typeof MOVEMENT_TYPES)[number], number>
  for (const row of movementRows) byType[row.type] += 1
  const buckets = buildBuckets(period.from, period.to, granularity)
  const movementsByBucket = new Map<string, MovementTrendRow[]>()
  for (const row of movementRows) {
    const key = bucketKey(row.occurredAt, granularity)
    const list = movementsByBucket.get(key) ?? []
    list.push(row)
    movementsByBucket.set(key, list)
  }
  return {
    block: 'inventory',
    descriptor: BLOCK_DESCRIPTORS.inventory,
    period,
    granularity,
    metrics: {
      movementCount: movementRows.length,
      netQuantity: roundMoney(computeStock(movementRows)),
      byType,
      lowStockCount: lowStock.length,
    },
    trend: buckets.map((bucket) => {
      const movements = movementsByBucket.get(bucket.key) ?? []
      return {
        bucket: bucket.key,
        label: bucket.label,
        count: movements.length,
        amount: roundMoney(computeStock(movements)),
      }
    }),
    lowStock: lowStock.map((product) => ({
      code: product.code,
      name: product.name,
      stock: product.stock,
      minimumStock: product.minimumStock,
      unitLabel: product.unitLabel,
    })),
  }
}

async function buildServicesBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<Extract<ReportBlockData, { block: 'services' }>> {
  const serviceRows = await reportsRepository.listServiceLinesInPeriod(
    period.from,
    period.to,
  )
  const aggregated = new Map<
    string,
    { code: string; name: string; quantity: number; amount: number }
  >()
  for (const row of serviceRows) {
    const key = `${row.code}:${row.name}`
    const entry = aggregated.get(key) ?? {
      code: row.code,
      name: row.name,
      quantity: 0,
      amount: 0,
    }
    entry.quantity += row.quantity
    entry.amount += row.amount
    aggregated.set(key, entry)
  }
  const services = [...aggregated.values()]
    .map((service) => ({
      code: service.code,
      name: service.name,
      quantity: roundQuantity(service.quantity),
      amount: roundMoney(service.amount),
    }))
    .sort((a, b) => b.amount - a.amount)
  const amount = sumAmount(services.map((service) => service.amount))
  const unitsSold = services.reduce((sum, service) => sum + service.quantity, 0)
  const buckets = buildBuckets(period.from, period.to, granularity)
  return {
    block: 'services',
    descriptor: BLOCK_DESCRIPTORS.services,
    period,
    granularity,
    metrics: {
      serviceCount: services.length,
      unitsSold: roundQuantity(unitsSold),
      amount,
      averagePerUnit: unitsSold > 0 ? roundMoney(amount / unitsSold) : 0,
    },
    trend: buildTrend(
      serviceRows,
      (row: ServiceLineRow) => ({
        date: row.saleConfirmedAt,
        count: row.quantity,
        amount: row.amount,
      }),
      buckets,
      granularity,
    ),
    top: services.slice(0, 10),
  }
}

async function buildWorkshopBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<Extract<ReportBlockData, { block: 'workshop' }>> {
  const [workOrders, deliveries, appointmentsByStatus] = await Promise.all([
    reportsRepository.listWorkOrdersInPeriod(period.from, period.to),
    reportsRepository.listDeliveredWorkOrdersInPeriod(period.from, period.to),
    reportsRepository.countAppointmentsInPeriod(period.from, period.to),
  ])
  const workOrdersByStatus = Object.fromEntries(
    WORK_ORDER_STATUSES.map((status) => [status, 0]),
  ) as Extract<
    ReportBlockData,
    { block: 'workshop' }
  >['metrics']['workOrdersByStatus']
  for (const row of workOrders) workOrdersByStatus[row.status] += 1
  const buckets = buildBuckets(period.from, period.to, granularity)
  const ordersByBucket = new Map<string, number>()
  const deliveriesByBucket = new Map<string, number>()
  for (const row of workOrders) {
    const key = bucketKey(row.createdAt, granularity)
    ordersByBucket.set(key, (ordersByBucket.get(key) ?? 0) + 1)
  }
  for (const row of deliveries) {
    if (!row.deliveredAt) continue
    const key = bucketKey(row.deliveredAt, granularity)
    deliveriesByBucket.set(key, (deliveriesByBucket.get(key) ?? 0) + 1)
  }
  const averageDeliveryHours =
    deliveries.length > 0
      ? Math.round(
          (deliveries.reduce((sum, row) => {
            if (!row.deliveredAt) return sum
            const hours =
              (row.deliveredAt.getTime() - row.createdAt.getTime()) / 3_600_000
            return sum + hours
          }, 0) /
            deliveries.length) *
            10,
        ) / 10
      : null
  return {
    block: 'workshop',
    descriptor: BLOCK_DESCRIPTORS.workshop,
    period,
    granularity,
    metrics: {
      workOrderCount: workOrders.length,
      workOrdersByStatus,
      deliveredCount: deliveries.length,
      averageDeliveryHours,
      appointmentCount: Object.values(appointmentsByStatus).reduce(
        (sum, count) => sum + count,
        0,
      ),
      appointmentsByStatus,
    },
    trend:
      buckets.length > 0
        ? buckets.map((bucket) => ({
            bucket: bucket.key,
            label: bucket.label,
            count: ordersByBucket.get(bucket.key) ?? 0,
            amount: deliveriesByBucket.get(bucket.key) ?? 0,
          }))
        : emptyTrend(buckets),
  }
}

async function buildBlock(
  block: ReportBlock,
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<ReportBlockData> {
  switch (block) {
    case 'sales':
      return buildSalesBlock(period, granularity)
    case 'payments':
      return buildPaymentsBlock(period, granularity)
    case 'inventory':
      return buildInventoryBlock(period, granularity)
    case 'services':
      return buildServicesBlock(period, granularity)
    case 'workshop':
      return buildWorkshopBlock(period, granularity)
  }
}

export const reportsService = {
  async getSummary(
    filters: { from: string | null; to: string | null },
    permissions: readonly string[],
  ): Promise<ReportSummary> {
    const period = resolvePeriod(filters.from, filters.to)
    const allowed = authorizedBlocks(permissions)
    return {
      generatedAt: new Date().toISOString(),
      period,
      blocks: Object.fromEntries(
        allowed.map((block) => [block, BLOCK_DESCRIPTORS[block]]),
      ),
    }
  },

  async getBlock(
    block: ReportBlock,
    filters: { from: string | null; to: string | null },
    permissions: readonly string[],
  ): Promise<ReportBlockData> {
    assertBlockAccess(block, permissions)
    const period = resolvePeriod(filters.from, filters.to)
    const granularity = resolveGranularity(period.from, period.to)
    return buildBlock(block, period, granularity)
  },
}
