import type { Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { toDateOnly } from '../appointments/appointment.rules.js'
import type { MovementType } from '../inventory/inventory.types.js'
import { operationsRepository } from '../operations/operations.repository.js'
import type {
  AppointmentStatus,
  WorkOrderStatus,
} from '../operations/operations.types.js'

export interface SaleTrendRow {
  total: number
  confirmedAt: Date
}

export interface SaleLineRow {
  type: 'PRODUCT' | 'SERVICE'
  code: string
  name: string
  quantity: number
  amount: number
}

export interface PaymentTrendRow {
  type: 'PAYMENT' | 'COMPENSATION'
  amount: number
  occurredAt: Date
}

export interface MovementTrendRow {
  type: MovementType
  quantity: number
  occurredAt: Date
}

export interface ServiceLineRow {
  code: string
  name: string
  quantity: number
  amount: number
  saleConfirmedAt: Date
}

export interface WorkOrderRow {
  status: WorkOrderStatus
  createdAt: Date
  deliveredAt: Date | null
}

function confirmedAtPeriod(from: string, to: string): Prisma.SaleWhereInput {
  return {
    confirmedAt: {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    },
  }
}

function occurredAtPeriod(
  from: string,
  to: string,
): { occurredAt: { gte: Date; lte: Date } } {
  return {
    occurredAt: {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    },
  }
}

function createdAtPeriod(from: string, to: string): Prisma.WorkOrderWhereInput {
  return {
    createdAt: {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    },
  }
}

function deliveredAtPeriod(
  from: string,
  to: string,
): Prisma.WorkOrderWhereInput {
  return {
    deliveredAt: {
      gte: new Date(`${from}T00:00:00.000Z`),
      lte: new Date(`${to}T23:59:59.999Z`),
    },
  }
}

function datePeriodWhere(
  from: string,
  to: string,
): Prisma.AppointmentWhereInput {
  return {
    date: {
      gte: toDateOnly(from),
      lte: toDateOnly(to),
    },
  }
}

function confirmedSaleLinesPeriod(
  from: string,
  to: string,
): Prisma.SaleLineWhereInput {
  return {
    sale: {
      is: {
        status: 'CONFIRMED',
        ...confirmedAtPeriod(from, to),
      },
    },
  }
}

export const reportsRepository = {
  async listSalesInPeriod(from: string, to: string): Promise<SaleTrendRow[]> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.sale.findMany({
        where: { status: 'CONFIRMED', ...confirmedAtPeriod(from, to) },
        select: { total: true, confirmedAt: true },
        orderBy: { confirmedAt: 'asc' },
      })
      return rows.map((row) => ({
        total: Number(row.total),
        confirmedAt: row.confirmedAt ?? new Date(`${from}T00:00:00.000Z`),
      }))
    })
  },

  async listSaleLinesInPeriod(
    from: string,
    to: string,
  ): Promise<SaleLineRow[]> {
    return databaseService.transaction(async (transaction) => {
      const grouped = await transaction.saleLine.groupBy({
        by: ['type', 'code', 'name'],
        where: confirmedSaleLinesPeriod(from, to),
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
      })
      return grouped.map((item) => ({
        type: item.type,
        code: item.code,
        name: item.name,
        quantity: Number(item._sum.quantity ?? 0),
        amount: Number(item._sum.subtotal ?? 0),
      }))
    })
  },

  async listPaymentsInPeriod(
    from: string,
    to: string,
  ): Promise<PaymentTrendRow[]> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.payment.findMany({
        where: { ...occurredAtPeriod(from, to) },
        select: { type: true, amount: true, occurredAt: true },
        orderBy: { occurredAt: 'asc' },
      })
      return rows.map((row) => ({
        type: row.type,
        amount: Number(row.amount),
        occurredAt: row.occurredAt,
      }))
    })
  },

  async listMovementsInPeriod(
    from: string,
    to: string,
  ): Promise<MovementTrendRow[]> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.inventoryMovement.findMany({
        where: { status: 'CONFIRMED', ...occurredAtPeriod(from, to) },
        select: { type: true, quantity: true, occurredAt: true },
        orderBy: { occurredAt: 'asc' },
      })
      return rows.map((row) => ({
        type: row.type,
        quantity: Number(row.quantity),
        occurredAt: row.occurredAt,
      }))
    })
  },

  async listServiceLinesInPeriod(
    from: string,
    to: string,
  ): Promise<ServiceLineRow[]> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.saleLine.findMany({
        where: {
          type: 'SERVICE',
          sale: {
            is: {
              status: 'CONFIRMED',
              ...confirmedAtPeriod(from, to),
            },
          },
        },
        select: {
          code: true,
          name: true,
          quantity: true,
          subtotal: true,
          sale: { select: { confirmedAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
      return rows.map((row) => ({
        code: row.code,
        name: row.name,
        quantity: Number(row.quantity),
        amount: Number(row.subtotal),
        saleConfirmedAt:
          row.sale.confirmedAt ?? new Date(`${from}T00:00:00.000Z`),
      }))
    })
  },

  async listWorkOrdersInPeriod(
    from: string,
    to: string,
  ): Promise<WorkOrderRow[]> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.workOrder.findMany({
        where: { ...createdAtPeriod(from, to) },
        select: { status: true, createdAt: true, deliveredAt: true },
        orderBy: { createdAt: 'asc' },
      })
      return rows.map((row) => ({
        status: row.status,
        createdAt: row.createdAt,
        deliveredAt: row.deliveredAt,
      }))
    })
  },

  async listDeliveredWorkOrdersInPeriod(
    from: string,
    to: string,
  ): Promise<WorkOrderRow[]> {
    return databaseService.transaction(async (transaction) => {
      const rows = await transaction.workOrder.findMany({
        where: { status: 'ENTREGADA', ...deliveredAtPeriod(from, to) },
        select: { status: true, createdAt: true, deliveredAt: true },
        orderBy: { deliveredAt: 'asc' },
      })
      return rows.map((row) => ({
        status: row.status,
        createdAt: row.createdAt,
        deliveredAt: row.deliveredAt,
      }))
    })
  },

  async countAppointmentsInPeriod(
    from: string,
    to: string,
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

  listPendingObligations:
    operationsRepository.listPendingObligations.bind(operationsRepository),

  listLowStockProducts:
    operationsRepository.listLowStockProducts.bind(operationsRepository),
}
