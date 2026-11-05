import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  cashSessionsRepository,
  lockCashSession,
} from '../cash-sessions/cash-session.repository.js'
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
  SplitPaymentRegisterInput,
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
    organizationId: context.organizationId,
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
  organizationId: string,
): Prisma.SaleWhereInput {
  const search = filters.search?.trim()
  const where: Prisma.SaleWhereInput = {
    organizationId,
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
  organizationId: string,
): Promise<ObligationDetailRow | null> {
  const sale = await transaction.sale.findFirst({
    where: { id: saleId, organizationId },
    select: obligationSaleSelect,
  })
  if (!sale) return null
  const events = await transaction.payment.findMany({
    where: { saleId, organizationId },
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
    organizationId: string,
  ): Promise<ObligationRow[]> {
    const sales = await databaseService.client.sale.findMany({
      where: buildObligationWhere(filters, organizationId),
      select: obligationSaleSelect,
      orderBy: { confirmedAt: 'desc' },
    })
    if (!sales.length) return []

    const payments = await databaseService.client.payment.findMany({
      where: { organizationId, saleId: { in: sales.map((sale) => sale.id) } },
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
  },

  async findById(
    id: string,
    organizationId: string,
  ): Promise<ObligationDetailRow | null> {
    return databaseService.transaction(async (transaction) => {
      return loadObligation(transaction, id, organizationId)
    })
  },

  async registerPayment(
    saleId: string,
    input: PaymentRegisterInput,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<ObligationDetailRow> {
    return databaseService.transaction(async (transaction) => {
      await lockCashSession(transaction, organizationId)
      await lockSale(transaction, saleId)
      const sale = await transaction.sale.findFirst({
        where: { id: saleId, organizationId },
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

      const idempotencyKey = `payment:${saleId}:${input.requestId}`
      const replay = await transaction.payment.findUnique({
        where: { idempotencyKey },
        select: { id: true, organizationId: true },
      })
      if (replay) {
        if (replay.organizationId !== organizationId)
          throw new AppError(
            409,
            'IDEMPOTENCY_KEY_CONFLICT',
            'La solicitud ya fue usada en otra organización.',
          )
        return loadObligation(
          transaction,
          saleId,
          organizationId,
        ) as Promise<ObligationDetailRow>
      }

      const cashSession = await cashSessionsRepository.requireOpenSession(
        transaction,
        organizationId,
      )
      const payments = await transaction.payment.findMany({
        where: { saleId, organizationId },
        select: { type: true, amount: true },
      })
      const paid = computePaidAmount(payments)
      const balance = computeBalance(sale.total, paid)
      assertValidPaymentAmount(input.amount)
      assertPaymentDoesNotExceedBalance(input.amount, balance)

      const code = await nextCode(transaction, 'PAGO')
      const payment = await transaction.payment.create({
        data: {
          organizationId,
          code,
          saleId,
          customerId: sale.customerId,
          cashSessionId: cashSession.id,
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

      return loadObligation(
        transaction,
        saleId,
        organizationId,
      ) as Promise<ObligationDetailRow>
    })
  },

  async registerSplitPayment(
    saleId: string,
    input: SplitPaymentRegisterInput,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<ObligationDetailRow> {
    return databaseService.transaction(async (transaction) => {
      await lockCashSession(transaction, organizationId)
      await lockSale(transaction, saleId)
      const sale = await transaction.sale.findFirst({
        where: { id: saleId, organizationId },
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

      const idempotencyPrefix = `payment-split:${saleId}:${input.requestId}`
      const replay = await transaction.payment.findUnique({
        where: { idempotencyKey: `${idempotencyPrefix}:0` },
        select: { id: true, organizationId: true },
      })
      if (replay) {
        if (replay.organizationId !== organizationId)
          throw new AppError(
            409,
            'IDEMPOTENCY_KEY_CONFLICT',
            'La solicitud ya fue usada en otra organización.',
          )
        return loadObligation(
          transaction,
          saleId,
          organizationId,
        ) as Promise<ObligationDetailRow>
      }

      const cashSession = await cashSessionsRepository.requireOpenSession(
        transaction,
        organizationId,
      )
      const payments = await transaction.payment.findMany({
        where: { saleId, organizationId },
        select: { type: true, amount: true },
      })
      const paid = computePaidAmount(payments)
      const balance = computeBalance(sale.total, paid)
      const totalAmount = roundMoney(
        input.payments.reduce((sum, payment) => sum + payment.amount, 0),
      )
      for (const payment of input.payments) {
        assertValidPaymentAmount(payment.amount)
      }
      assertPaymentDoesNotExceedBalance(totalAmount, balance)

      const occurredAt = new Date()
      const createdPayments: Array<{
        id: string
        code: string
        amount: number
        method: PaymentMethod
      }> = []
      for (const [index, item] of input.payments.entries()) {
        const code = await nextCode(transaction, 'PAGO')
        const payment = await transaction.payment.create({
          data: {
            organizationId,
            code,
            saleId,
            customerId: sale.customerId,
            cashSessionId: cashSession.id,
            type: 'PAYMENT',
            amount: item.amount,
            method: item.method,
            idempotencyKey: `${idempotencyPrefix}:${index}`,
            notes: input.notes?.trim() || null,
            performedBy: actor.name,
            occurredAt,
          },
          select: { id: true },
        })
        createdPayments.push({
          id: payment.id,
          code,
          amount: item.amount,
          method: item.method,
        })
      }

      await transaction.auditLog.create({
        data: auditData('PAYMENT_REGISTERED', actor.id, sale.code, context, {
          saleId,
          code: sale.code,
          mode: 'SPLIT',
          payments: createdPayments,
          totalAmount,
          balanceBefore: balance,
          balanceAfter: roundMoney(balance - totalAmount),
        }),
      })

      return loadObligation(
        transaction,
        saleId,
        organizationId,
      ) as Promise<ObligationDetailRow>
    })
  },

  async compensatePayment(
    paymentId: string,
    input: PaymentCompensateInput,
    actor: { id: string; name: string },
    context: RequestContext,
    organizationId: string,
  ): Promise<ObligationDetailRow> {
    return databaseService.transaction(async (transaction) => {
      const paymentRow = await transaction.payment.findFirst({
        where: { id: paymentId, organizationId },
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

      await lockCashSession(transaction, organizationId)
      await lockSale(transaction, paymentRow.saleId)
      const locked = await transaction.payment.findFirst({
        where: { id: paymentId, organizationId },
        select: { id: true, type: true, amount: true, saleId: true },
      })
      if (!locked || locked.type !== 'PAYMENT')
        throw new AppError(404, 'PAYMENT_NOT_FOUND', 'Pago no encontrado.')

      const idempotencyKey = `payment-compensation:${paymentId}:${input.requestId}`
      const replay = await transaction.payment.findUnique({
        where: { idempotencyKey },
        select: { id: true, organizationId: true },
      })
      if (replay) {
        if (replay.organizationId !== organizationId)
          throw new AppError(
            409,
            'IDEMPOTENCY_KEY_CONFLICT',
            'La solicitud ya fue usada en otra organización.',
          )
        return loadObligation(
          transaction,
          locked.saleId,
          organizationId,
        ) as Promise<ObligationDetailRow>
      }

      const cashSession = await cashSessionsRepository.requireOpenSession(
        transaction,
        organizationId,
      )
      const compensations = await transaction.payment.findMany({
        where: { originalPaymentId: paymentId, organizationId },
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

      const code = await nextCode(transaction, 'COMP')
      const compensation = await transaction.payment.create({
        data: {
          organizationId,
          code,
          saleId: locked.saleId,
          cashSessionId: cashSession.id,
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
        organizationId,
      ) as Promise<ObligationDetailRow>
    })
  },
}
