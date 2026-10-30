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
  InventoryTrendPoint,
  PaymentsTrendPoint,
  ReportBlock,
  ReportBlockData,
  ReportGranularity,
  ReportPeriod,
  ReportSummary,
  ReportTrendPoint,
  WorkshopTrendPoint,
} from './reports.types.js'
import { createReportsWorkbook } from './reports.exporter.js'
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

type BlockData<B extends ReportBlock> = Omit<
  Extract<ReportBlockData, { block: B }>,
  'generatedAt'
>

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

async function buildSalesBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<BlockData<'sales'>> {
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
): Promise<BlockData<'payments'>> {
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
    trend: buildPaymentsTrend(paymentRows, buckets, granularity),
  }
}

async function buildInventoryBlock(
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<BlockData<'inventory'>> {
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
    trend: buckets.map((bucket): InventoryTrendPoint => {
      const movements = movementsByBucket.get(bucket.key) ?? []
      const quantities = {
        initial: 0,
        entry: 0,
        exit: 0,
        adjustmentIn: 0,
        adjustmentOut: 0,
      }
      for (const movement of movements) {
        switch (movement.type) {
          case 'INITIAL':
            quantities.initial += movement.quantity
            break
          case 'ENTRY':
            quantities.entry += movement.quantity
            break
          case 'EXIT':
            quantities.exit += movement.quantity
            break
          case 'ADJUSTMENT_IN':
            quantities.adjustmentIn += movement.quantity
            break
          case 'ADJUSTMENT_OUT':
            quantities.adjustmentOut += movement.quantity
            break
        }
      }
      return {
        bucket: bucket.key,
        label: bucket.label,
        count: movements.length,
        amount: roundMoney(computeStock(movements)),
        initial: roundQuantity(quantities.initial),
        entry: roundQuantity(quantities.entry),
        exit: roundQuantity(quantities.exit),
        adjustmentIn: roundQuantity(quantities.adjustmentIn),
        adjustmentOut: roundQuantity(quantities.adjustmentOut),
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
): Promise<BlockData<'services'>> {
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
): Promise<BlockData<'workshop'>> {
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
    trend: buckets.map(
      (bucket): WorkshopTrendPoint => ({
        bucket: bucket.key,
        label: bucket.label,
        count: ordersByBucket.get(bucket.key) ?? 0,
        amount: deliveriesByBucket.get(bucket.key) ?? 0,
        ordersCreated: ordersByBucket.get(bucket.key) ?? 0,
        delivered: deliveriesByBucket.get(bucket.key) ?? 0,
      }),
    ),
  }
}

async function buildBlock(
  block: ReportBlock,
  period: ReportPeriod,
  granularity: ReportGranularity,
): Promise<ReportBlockData> {
  const generatedAt = new Date().toISOString()
  switch (block) {
    case 'sales':
      return { ...(await buildSalesBlock(period, granularity)), generatedAt }
    case 'payments':
      return { ...(await buildPaymentsBlock(period, granularity)), generatedAt }
    case 'inventory':
      return {
        ...(await buildInventoryBlock(period, granularity)),
        generatedAt,
      }
    case 'services':
      return { ...(await buildServicesBlock(period, granularity)), generatedAt }
    case 'workshop':
      return { ...(await buildWorkshopBlock(period, granularity)), generatedAt }
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

  async exportWorkbook(
    filters: { from: string | null; to: string | null },
    permissions: readonly string[],
  ): Promise<{ file: Buffer; period: ReportPeriod }> {
    const period = resolvePeriod(filters.from, filters.to)
    const granularity = resolveGranularity(period.from, period.to)
    const blocks = await Promise.all(
      authorizedBlocks(permissions).map((block) =>
        buildBlock(block, period, granularity),
      ),
    )
    const generatedAt = new Date().toISOString()
    return {
      file: await createReportsWorkbook({ period, generatedAt, blocks }),
      period,
    }
  },
}

function buildPaymentsTrend(
  rows: readonly PaymentTrendRow[],
  buckets: Array<{ key: string; label: string }>,
  granularity: ReportGranularity,
): PaymentsTrendPoint[] {
  const totals = new Map<
    string,
    { count: number; grossCollected: number; compensated: number }
  >()
  for (const row of rows) {
    const key = bucketKey(row.occurredAt, granularity)
    const slot = totals.get(key) ?? {
      count: 0,
      grossCollected: 0,
      compensated: 0,
    }
    slot.count += 1
    if (row.type === 'PAYMENT') slot.grossCollected += row.amount
    else slot.compensated += row.amount
    totals.set(key, slot)
  }
  return buckets.map((bucket) => {
    const slot = totals.get(bucket.key)
    const grossCollected = roundMoney(slot?.grossCollected ?? 0)
    const compensated = roundMoney(slot?.compensated ?? 0)
    return {
      bucket: bucket.key,
      label: bucket.label,
      count: slot?.count ?? 0,
      amount: roundMoney(grossCollected - compensated),
      grossCollected,
      compensated,
      netCollected: roundMoney(grossCollected - compensated),
    }
  })
}
