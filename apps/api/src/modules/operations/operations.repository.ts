import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { toDateOnly } from '../appointments/appointment.rules.js'
import { computeStock } from '../inventory/inventory.rules.js'
import type { MovementType } from '../inventory/inventory.types.js'
import { paymentsRepository } from '../payments/payment.repository.js'
import { computeBalance, roundMoney } from '../payments/payment.rules.js'
import { WORK_ORDER_ATTENTION_STATUSES } from './operations.rules.js'
import {
  WORK_ORDER_STATUSES,
  type AppointmentStatus,
  type WorkOrderStatus,
} from './operations.types.js'

export interface CustomerNameRow {
  firstName: string | null
  lastName: string | null
  legalName: string | null
}

export interface AppointmentAttentionRow {
  id: string
  code: string
  date: Date
  time: Date
  status: AppointmentStatus
  customer: CustomerNameRow | null
  vehicle: { plate: string } | null
}

export interface WorkOrderAttentionRow {
  id: string
  code: string
  status: WorkOrderStatus
  createdAt: Date
  customer: CustomerNameRow | null
  vehicle: { plate: string } | null
}

export interface SaleAttentionRow {
  id: string
  code: string
  total: number
  confirmedAt: Date
  customer: CustomerNameRow | null
}

export interface PendingObligationRow {
  id: string
  code: string
  total: number
  confirmedAt: Date
  customer: CustomerNameRow | null
  payments: Array<{ type: 'PAYMENT' | 'COMPENSATION'; amount: unknown }>
}

export interface LowStockRow {
  id: string
  code: string
  name: string
  stock: number
  minimumStock: number
  unitLabel: string
}

function datePeriodWhere(
  from: string | null,
  to: string | null,
): Prisma.AppointmentWhereInput {
  if (!from && !to) return {}
  return {
    date: {
      ...(from ? { gte: toDateOnly(from) } : {}),
      ...(to ? { lte: toDateOnly(to) } : {}),
    },
  }
}

function createdAtPeriod(from: string | null, to: string | null) {
  if (!from && !to) return {}
  return {
    createdAt: {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    },
  }
}

function confirmedAtPeriod(from: string | null, to: string | null) {
  if (!from && !to) return {}
  return {
    confirmedAt: {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    },
  }
}

const customerNameSelect = {
  firstName: true,
  lastName: true,
  legalName: true,
} satisfies Prisma.CustomerSelect

export const operationsRepository = {
  async countAppointmentsByStatus(
    from: string | null,
    to: string | null,
  ): Promise<Record<AppointmentStatus, number>> {
    const grouped = await databaseService.client.appointment.groupBy({
      by: ['status'],
      where: { ...datePeriodWhere(from, to) },
      _count: { _all: true },
    })
    const result: Record<AppointmentStatus, number> = {
      PROGRAMADA: 0,
      CANCELADA: 0,
      ATENDIDA: 0,
    }
    for (const item of grouped) result[item.status] = item._count._all
    return result
  },

  async listAppointmentAttention(
    from: string | null,
    to: string | null,
    skip: number,
    take: number,
  ): Promise<{ items: AppointmentAttentionRow[]; total: number }> {
    const where: Prisma.AppointmentWhereInput = {
      ...datePeriodWhere(from, to),
      status: 'PROGRAMADA',
    }
    const [items, total] = await Promise.all([
      databaseService.client.appointment.findMany({
        where,
        select: {
          id: true,
          code: true,
          date: true,
          time: true,
          status: true,
          customer: { select: customerNameSelect },
          vehicle: { select: { plate: true } },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        skip,
        take,
      }),
      databaseService.client.appointment.count({ where }),
    ])
    return { items, total }
  },

  async countWorkOrdersByStatus(
    from: string | null,
    to: string | null,
  ): Promise<Record<WorkOrderStatus, number>> {
    const grouped = await databaseService.client.workOrder.groupBy({
      by: ['status'],
      where: { ...createdAtPeriod(from, to) },
      _count: { _all: true },
    })
    const result = Object.fromEntries(
      WORK_ORDER_STATUSES.map((status) => [status, 0]),
    ) as Record<WorkOrderStatus, number>
    for (const item of grouped) result[item.status] = item._count._all
    return result
  },

  async listWorkOrderAttention(
    from: string | null,
    to: string | null,
    skip: number,
    take: number,
  ): Promise<{ items: WorkOrderAttentionRow[]; total: number }> {
    const where: Prisma.WorkOrderWhereInput = {
      ...createdAtPeriod(from, to),
      status: { in: [...WORK_ORDER_ATTENTION_STATUSES] },
    }
    const [items, total] = await Promise.all([
      databaseService.client.workOrder.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          createdAt: true,
          customer: { select: customerNameSelect },
          vehicle: { select: { plate: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      databaseService.client.workOrder.count({ where }),
    ])
    return { items, total }
  },

  async summarizeSales(
    from: string | null,
    to: string | null,
  ): Promise<{ confirmedCount: number; confirmedAmount: number }> {
    const aggregate = await databaseService.client.sale.aggregate({
      where: { status: 'CONFIRMED', ...confirmedAtPeriod(from, to) },
      _count: { _all: true },
      _sum: { total: true },
    })
    return {
      confirmedCount: aggregate._count._all,
      confirmedAmount: Number(aggregate._sum.total ?? 0),
    }
  },

  async listSaleAttention(
    from: string | null,
    to: string | null,
    skip: number,
    take: number,
  ): Promise<{ items: SaleAttentionRow[]; total: number }> {
    const where: Prisma.SaleWhereInput = {
      status: 'CONFIRMED',
      ...confirmedAtPeriod(from, to),
    }
    const [rows, total] = await Promise.all([
      databaseService.client.sale.findMany({
        where,
        select: {
          id: true,
          code: true,
          total: true,
          confirmedAt: true,
          createdAt: true,
          customer: { select: customerNameSelect },
        },
        orderBy: { confirmedAt: 'desc' },
        skip,
        take,
      }),
      databaseService.client.sale.count({ where }),
    ])
    return {
      items: rows.map((row) => ({
        id: row.id,
        code: row.code,
        total: Number(row.total),
        confirmedAt: row.confirmedAt ?? row.createdAt,
        customer: row.customer,
      })),
      total,
    }
  },

  async listPendingObligations(): Promise<PendingObligationRow[]> {
    const rows = await paymentsRepository.listObligations({
      search: '',
      from: null,
      to: null,
    })
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      total: row.total,
      confirmedAt: row.confirmedAt,
      customer: row.customer,
      payments: row.payments,
    }))
  },

  async summarizePendingObligations(): Promise<{
    pendingCount: number
    pendingAmount: number
  }> {
    const sales = await databaseService.client.sale.findMany({
      where: { status: 'CONFIRMED', total: { gt: 0 } },
      select: { id: true, total: true },
    })
    if (!sales.length) return { pendingCount: 0, pendingAmount: 0 }

    const grouped = await databaseService.client.payment.groupBy({
      by: ['saleId', 'type'],
      where: { saleId: { in: sales.map((sale) => sale.id) } },
      _sum: { amount: true },
    })
    const paidBySale = new Map<string, number>()
    for (const item of grouped) {
      const current = paidBySale.get(item.saleId) ?? 0
      const amount = Number(item._sum.amount ?? 0)
      paidBySale.set(
        item.saleId,
        item.type === 'PAYMENT' ? current + amount : current - amount,
      )
    }

    return sales.reduce(
      (summary, sale) => {
        const balance = computeBalance(sale.total, paidBySale.get(sale.id) ?? 0)
        if (balance <= 0) return summary
        return {
          pendingCount: summary.pendingCount + 1,
          pendingAmount: roundMoney(summary.pendingAmount + balance),
        }
      },
      { pendingCount: 0, pendingAmount: 0 },
    )
  },

  async listLowStockProducts(): Promise<LowStockRow[]> {
    const [products, grouped] = await Promise.all([
      databaseService.client.product.findMany({
        where: { active: true },
        select: {
          id: true,
          code: true,
          name: true,
          minimumStock: true,
          unit: { select: { symbol: true } },
        },
        orderBy: { name: 'asc' },
      }),
      databaseService.client.inventoryMovement.groupBy({
        by: ['productId', 'type'],
        where: { status: 'CONFIRMED' },
        _sum: { quantity: true },
      }),
    ])

    const movementsByProduct = new Map<
      string,
      Array<{ type: MovementType; quantity: unknown }>
    >()
    for (const item of grouped) {
      const list = movementsByProduct.get(item.productId) ?? []
      list.push({ type: item.type, quantity: item._sum.quantity ?? 0 })
      movementsByProduct.set(item.productId, list)
    }

    return products
      .map((product) => ({
        id: product.id,
        code: product.code,
        name: product.name,
        stock: computeStock(movementsByProduct.get(product.id) ?? []),
        minimumStock: Number(product.minimumStock),
        unitLabel: product.unit.symbol,
      }))
      .filter((product) => product.stock <= product.minimumStock)
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  async countLowStockProducts(): Promise<number> {
    const [products, grouped] = await Promise.all([
      databaseService.client.product.findMany({
        where: { active: true },
        select: { id: true, minimumStock: true },
      }),
      databaseService.client.inventoryMovement.groupBy({
        by: ['productId', 'type'],
        where: { status: 'CONFIRMED' },
        _sum: { quantity: true },
      }),
    ])

    const movementsByProduct = new Map<
      string,
      Array<{ type: MovementType; quantity: unknown }>
    >()
    for (const item of grouped) {
      const list = movementsByProduct.get(item.productId) ?? []
      list.push({ type: item.type, quantity: item._sum.quantity ?? 0 })
      movementsByProduct.set(item.productId, list)
    }

    return products.reduce(
      (count, product) =>
        computeStock(movementsByProduct.get(product.id) ?? []) <=
        Number(product.minimumStock)
          ? count + 1
          : count,
      0,
    )
  },
}
