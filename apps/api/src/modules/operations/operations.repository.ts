import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { toDateOnly } from '../appointments/appointment.rules.js'
import { computeStock } from '../inventory/inventory.rules.js'
import type { MovementType } from '../inventory/inventory.types.js'
import { paymentsRepository } from '../payments/payment.repository.js'
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
    return databaseService.transaction(async (transaction) => {
      const grouped = await transaction.appointment.groupBy({
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
    })
  },

  async listAppointmentAttention(
    from: string | null,
    to: string | null,
    skip: number,
    take: number,
  ): Promise<{ items: AppointmentAttentionRow[]; total: number }> {
    return databaseService.transaction(async (transaction) => {
      const where: Prisma.AppointmentWhereInput = {
        ...datePeriodWhere(from, to),
        status: 'PROGRAMADA',
      }
      const [items, total] = await Promise.all([
        transaction.appointment.findMany({
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
        transaction.appointment.count({ where }),
      ])
      return { items, total }
    })
  },

  async countWorkOrdersByStatus(
    from: string | null,
    to: string | null,
  ): Promise<Record<WorkOrderStatus, number>> {
    return databaseService.transaction(async (transaction) => {
      const grouped = await transaction.workOrder.groupBy({
        by: ['status'],
        where: { ...createdAtPeriod(from, to) },
        _count: { _all: true },
      })
      const result = Object.fromEntries(
        WORK_ORDER_STATUSES.map((status) => [status, 0]),
      ) as Record<WorkOrderStatus, number>
      for (const item of grouped) result[item.status] = item._count._all
      return result
    })
  },

  async listWorkOrderAttention(
    from: string | null,
    to: string | null,
    skip: number,
    take: number,
  ): Promise<{ items: WorkOrderAttentionRow[]; total: number }> {
    return databaseService.transaction(async (transaction) => {
      const where: Prisma.WorkOrderWhereInput = {
        ...createdAtPeriod(from, to),
        status: { in: [...WORK_ORDER_ATTENTION_STATUSES] },
      }
      const [items, total] = await Promise.all([
        transaction.workOrder.findMany({
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
        transaction.workOrder.count({ where }),
      ])
      return { items, total }
    })
  },

  async summarizeSales(
    from: string | null,
    to: string | null,
  ): Promise<{ confirmedCount: number; confirmedAmount: number }> {
    return databaseService.transaction(async (transaction) => {
      const aggregate = await transaction.sale.aggregate({
        where: { status: 'CONFIRMED', ...confirmedAtPeriod(from, to) },
        _count: { _all: true },
        _sum: { total: true },
      })
      return {
        confirmedCount: aggregate._count._all,
        confirmedAmount: Number(aggregate._sum.total ?? 0),
      }
    })
  },

  async listSaleAttention(
    from: string | null,
    to: string | null,
    skip: number,
    take: number,
  ): Promise<{ items: SaleAttentionRow[]; total: number }> {
    return databaseService.transaction(async (transaction) => {
      const where: Prisma.SaleWhereInput = {
        status: 'CONFIRMED',
        ...confirmedAtPeriod(from, to),
      }
      const [rows, total] = await Promise.all([
        transaction.sale.findMany({
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
        transaction.sale.count({ where }),
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
    })
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

  async listLowStockProducts(): Promise<LowStockRow[]> {
    return databaseService.transaction(async (transaction) => {
      const [products, grouped] = await Promise.all([
        transaction.product.findMany({
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
        transaction.inventoryMovement.groupBy({
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
    })
  },
}
