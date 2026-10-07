import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  assertCompensationWithinPayment,
  assertPaymentDoesNotExceedBalance,
  assertValidPaymentAmount,
  computeBalance,
  computePaidAmount,
  roundMoney,
} from './payment.rules.js'
import type {
  PaymentCompensateInput,
  PaymentFilters,
  PaymentMethod,
  PaymentRegisterInput,
  PaymentType,
} from './payment.types.js'

export interface PaymentEventRow {
  id: string
  code: string
  type: PaymentType
  amount: number
  method: PaymentMethod
  notes: string | null
  reason: string | null
  performedBy: string
  occurredAt: Date
  createdAt: Date
  originalCode: string | null
}

export interface ObligationCustomerRow {
  id: string
  documentNumber: string
  firstName: string | null
  lastName: string | null
  legalName: string | null
}

export interface ObligationRow {
  id: string
  code: string
  status: 'CONFIRMED'
  total: number
  confirmedAt: Date
  createdAt: Date
  customer: ObligationCustomerRow | null
  payments: Array<{
    type: PaymentType
    amount: number
    method: PaymentMethod
    occurredAt: Date
  }>
}

export interface ObligationDetailRow {
  id: string
  code: string
  status: 'CONFIRMED'
  total: number
  confirmedAt: Date
  createdAt: Date
  customer: ObligationCustomerRow | null
  events: PaymentEventRow[]
}

const obligationSaleSelect = {
  id: true,
  code: true,
  status: true,
  total: true,
  confirmedAt: true,
  createdAt: true,
  customer: {
    select: {
      id: true,
      documentNumber: true,
      firstName: true,
      lastName: true,
      legalName: true,
    },
  },
} satisfies Prisma.SaleSelect

const obligationEventSelect = {
  id: true,
  code: true,
  type: true,
  amount: true,
  method: true,
  notes: true,
  reason: true,
  performedBy: true,
  occurredAt: true,
  createdAt: true,
  originalPayment: { select: { code: true } },
} satisfies Prisma.PaymentSelect

function auditData(
  event: AuditEventType,
  actorId: string,
  identifier: string,
  context: RequestContext,
  metadata?: Prisma.InputJsonValue,
) {
  return {
    event,
    userId: actorId,
    identifier,
    requestId: context.requestId,
    ipAddress: context.ipAddress,
    metadata,
  }
}

async function lockSale(transaction: Prisma.TransactionClient, saleId: string) {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:sale:${saleId}`}))`
}

function buildObligationWhere(
  filters: Pick<PaymentFilters, 'search' | 'from' | 'to'>,
): Prisma.SaleWhereInput {
  const search = filters.search?.trim()
  const where: Prisma.SaleWhereInput = {
    status: 'CONFIRMED',
    total: { gt: 0 },
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            {
              customer: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { legalName: { contains: search, mode: 'insensitive' } },
                  { documentNumber: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }
      : {}),
  }
  const from = filters.from
  const to = filters.to
  if (from || to) {
    where.confirmedAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    }
  }
  return where
}

async function loadObligation(
  transaction: Prisma.TransactionClient,
  saleId: string,
): Promise<ObligationDetailRow | null> {
  const sale = await transaction.sale.findUnique({
    where: { id: saleId },
    select: obligationSaleSelect,
  })
  if (!sale) return null
  const events = await transaction.payment.findMany({
    where: { saleId },
    select: obligationEventSelect,
    orderBy: { occurredAt: 'asc' },
  })
  return {
    ...sale,
    status: 'CONFIRMED',
    total: Number(sale.total),
    confirmedAt: sale.confirmedAt ?? sale.createdAt,
    events: events.map((event) => ({
      ...event,
      amount: Number(event.amount),
      originalCode: event.originalPayment?.code ?? null,
    })),
  }
}

async function nextCode(
  transaction: Prisma.TransactionClient,
  prefix: 'PAGO' | 'COMP',
): Promise<string> {
  const rows = await transaction.$queryRaw<
    Array<{ seq: number | string }>
  >`SELECT nextval('"payments_code_seq"') AS seq`
  return `${prefix}-${String(Number(rows[0].seq)).padStart(6, '0')}`
}

export const paymentsRepository = {
  async listObligations(
    filters: Pick<PaymentFilters, 'search' | 'from' | 'to'>,
  ): Promise<ObligationRow[]> {
    return databaseService.transaction(async (transaction) => {
      const sales = await transaction.sale.findMany({
        where: buildObligationWhere(filters),
        select: obligationSaleSelect,
        orderBy: { confirmedAt: 'desc' },
      })
      if (!sales.length) return []

      const payments = await transaction.payment.findMany({
        where: { saleId: { in: sales.map((sale) => sale.id) } },
        select: {
          saleId: true,
          type: true,
          amount: true,
          method: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: 'asc' },
      })
      const paymentsBySale = new Map<
        string,
        Array<{
          type: PaymentType
          amount: number
          method: PaymentMethod
          occurredAt: Date
        }>
      >()
      for (const payment of payments) {
        const list = paymentsBySale.get(payment.saleId) ?? []
        list.push({
          type: payment.type,
          amount: Number(payment.amount),
          method: payment.method,
          occurredAt: payment.occurredAt,
        })
        paymentsBySale.set(payment.saleId, list)
      }

      return sales.map((sale) => ({
        ...sale,
        status: 'CONFIRMED' as const,
        total: Number(sale.total),
        confirmedAt: sale.confirmedAt ?? sale.createdAt,
        payments: paymentsBySale.get(sale.id) ?? [],
      }))
    })
  },

  async findById(id: string): Promise<ObligationDetailRow | null> {
    return databaseService.transaction(async (transaction) => {
      return loadObligation(transaction, id)
    })
  },

  async registerPayment(
    saleId: string,
    input: PaymentRegisterInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<ObligationDetailRow> {
    return databaseService.transaction(async (transaction) => {
      await lockSale(transaction, saleId)
      const sale = await transaction.sale.findUnique({
        where: { id: saleId },
        select: {
          id: true,
          code: true,
          status: true,
          total: true,
          customerId: true,
        },
      })
      if (!sale)
        throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
      if (sale.status !== 'CONFIRMED')
        throw new AppError(
          409,
          'PAYMENT_SALE_NOT_CONFIRMED',
          'Solo se pueden registrar pagos para ventas confirmadas.',
        )
      if (Number(sale.total) <= 0)
        throw new AppError(
          409,
          'PAYMENT_SALE_TOTAL_INVALID',
          'La venta no tiene un importe pendiente de cobro.',
        )

      const payments = await transaction.payment.findMany({
        where: { saleId },
        select: { type: true, amount: true },
      })
      const paid = computePaidAmount(payments)
      const balance = computeBalance(sale.total, paid)
      assertValidPaymentAmount(input.amount)
      assertPaymentDoesNotExceedBalance(input.amount, balance)

      const idempotencyKey = `payment:${saleId}:${input.requestId}`
      const replay = await transaction.payment.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      })
      if (replay)
        return loadObligation(
          transaction,
          saleId,
        ) as Promise<ObligationDetailRow>

      const code = await nextCode(transaction, 'PAGO')
      const payment = await transaction.payment.create({
        data: {
          code,
          saleId,
          customerId: sale.customerId,
          type: 'PAYMENT',
          amount: input.amount,
          method: input.method,
          idempotencyKey,
          notes: input.notes?.trim() || null,
          performedBy: actor.name,
          occurredAt: new Date(),
        },
        select: { id: true },
      })

      await transaction.auditLog.create({
        data: auditData('PAYMENT_REGISTERED', actor.id, sale.code, context, {
          saleId,
          code: sale.code,
          paymentId: payment.id,
          paymentCode: code,
          amount: input.amount,
          method: input.method,
          balanceBefore: balance,
          balanceAfter: roundMoney(balance - input.amount),
        }),
      })

      return loadObligation(transaction, saleId) as Promise<ObligationDetailRow>
    })
  },

  async compensatePayment(
    paymentId: string,
    input: PaymentCompensateInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<ObligationDetailRow> {
    return databaseService.transaction(async (transaction) => {
      const paymentRow = await transaction.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          code: true,
          type: true,
          amount: true,
          method: true,
          saleId: true,
          sale: { select: { code: true, status: true } },
        },
      })
      if (!paymentRow)
        throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Pago no encontrado.')
      if (paymentRow.type !== 'PAYMENT')
        throw new AppError(
          409,
          'PAYMENT_NOT_COMPENSABLE',
          'Una compensación solo se aplica sobre un pago registrado.',
        )

      await lockSale(transaction, paymentRow.saleId)
      const locked = await transaction.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, type: true, amount: true, saleId: true },
      })
      if (!locked || locked.type !== 'PAYMENT')
        throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Pago no encontrado.')

      const compensations = await transaction.payment.findMany({
        where: { originalPaymentId: paymentId },
        select: { amount: true },
      })
      const alreadyCompensated = compensations.reduce(
        (sum, record) => sum + Number(record.amount),
        0,
      )
      assertValidPaymentAmount(input.amount)
      assertCompensationWithinPayment(
        input.amount,
        Number(locked.amount),
        alreadyCompensated,
      )

      const idempotencyKey = `payment-compensation:${paymentId}:${input.requestId}`
      const replay = await transaction.payment.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      })
      if (replay)
        return loadObligation(
          transaction,
          locked.saleId,
        ) as Promise<ObligationDetailRow>

      const code = await nextCode(transaction, 'COMP')
      const compensation = await transaction.payment.create({
        data: {
          code,
          saleId: locked.saleId,
          type: 'COMPENSATION',
          originalPaymentId: locked.id,
          amount: input.amount,
          method: paymentRow.method,
          idempotencyKey,
          notes: input.notes?.trim() || null,
          reason: input.reason.trim(),
          performedBy: actor.name,
          occurredAt: new Date(),
        },
        select: { id: true },
      })

      await transaction.auditLog.create({
        data: auditData(
          'PAYMENT_COMPENSATED',
          actor.id,
          paymentRow.sale.code,
          context,
          {
            saleId: locked.saleId,
            code: paymentRow.sale.code,
            paymentId: locked.id,
            paymentCode: paymentRow.code,
            compensationId: compensation.id,
            compensationCode: code,
            amount: input.amount,
            reason: input.reason.trim(),
          },
        ),
      })

      return loadObligation(
        transaction,
        locked.saleId,
      ) as Promise<ObligationDetailRow>
    })
  },
}
