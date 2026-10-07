import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  collectionStatusFromBalance,
  computeBalance,
  computePaidAmount,
} from './payment.rules.js'
import {
  paymentsRepository,
  type ObligationDetailRow,
  type ObligationRow,
  type PaymentEventRow,
} from './payment.repository.js'
import type {
  PaymentCompensateInput,
  PaymentDetail,
  PaymentEvent,
  PaymentFilters,
  PaymentObligationSummary,
  PaymentRegisterInput,
  PaymentsResponse,
} from './payment.types.js'

type CustomerRefRecord = {
  id: string
  documentNumber: string
  firstName: string | null
  lastName: string | null
  legalName: string | null
}

function toCustomerRef(customer: CustomerRefRecord | null) {
  if (!customer) return null
  return {
    id: customer.id,
    documentNumber: customer.documentNumber,
    name:
      (customer.legalName ??
        [customer.firstName, customer.lastName].filter(Boolean).join(' ')) ||
      'Sin nombre',
  }
}

function toSummary(row: ObligationRow): PaymentObligationSummary {
  const paid = computePaidAmount(row.payments)
  const balance = computeBalance(row.total, paid)
  return {
    id: row.id,
    code: row.code,
    customer: toCustomerRef(row.customer),
    status: 'CONFIRMED',
    total: row.total,
    paid,
    balance,
    collectionStatus: collectionStatusFromBalance(paid, balance),
    confirmedAt: row.confirmedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

function toEvent(event: PaymentEventRow): PaymentEvent {
  const isCompensation = event.type === 'COMPENSATION'
  return {
    id: event.id,
    code: event.code,
    type: event.type,
    amount: event.amount,
    netAmount: isCompensation ? -event.amount : event.amount,
    method: event.method,
    performedBy: event.performedBy,
    notes: event.notes,
    reason: event.reason,
    originalCode: event.originalCode,
    occurredAt: event.occurredAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
  }
}

function toDetail(row: ObligationDetailRow): PaymentDetail {
  const paid = computePaidAmount(row.events)
  const balance = computeBalance(row.total, paid)
  return {
    id: row.id,
    code: row.code,
    customer: toCustomerRef(row.customer),
    status: 'CONFIRMED',
    total: row.total,
    paid,
    balance,
    collectionStatus: collectionStatusFromBalance(paid, balance),
    confirmedAt: row.confirmedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    events: row.events.map(toEvent),
  }
}

function fromQuery(query: PaymentFilters): PaymentFilters {
  const from = query.from?.trim() || null
  const to = query.to?.trim() || null
  if (from && to && from > to)
    throw new AppError(
      400,
      'PAYMENT_DATE_RANGE_INVALID',
      'La fecha inicial no puede ser posterior a la fecha final.',
    )
  return { ...query, from, to }
}

export const paymentsService = {
  async list(filters: PaymentFilters): Promise<PaymentsResponse> {
    const normalized = fromQuery(filters)
    const rows = await paymentsRepository.listObligations(normalized)
    const methodFilter = normalized.method !== 'all' ? normalized.method : null

    let filtered = rows.map(toSummary)
    filtered = filtered.filter(
      (obligation) =>
        normalized.status === 'all' ||
        obligation.collectionStatus === normalized.status,
    )
    if (methodFilter) {
      filtered = filtered.filter((obligation) =>
        rows.some(
          (row) =>
            row.id === obligation.id &&
            row.payments.some((payment) => payment.method === methodFilter),
        ),
      )
    }

    const pending = filtered.filter(
      (obligation) => obligation.collectionStatus !== 'PAID',
    )
    const totalPages = Math.max(
      1,
      Math.ceil(filtered.length / normalized.pageSize),
    )
    const page = Math.min(normalized.page, totalPages)
    const start = (page - 1) * normalized.pageSize

    return {
      data: filtered.slice(start, start + normalized.pageSize),
      pagination: {
        page,
        pageSize: normalized.pageSize,
        total: filtered.length,
        totalPages,
      },
      summary: {
        pendingCount: pending.length,
        pendingAmount: pending.reduce(
          (sum, obligation) => sum + obligation.balance,
          0,
        ),
        collectedAmount: filtered.reduce((sum, obligation) => {
          const row = rows.find((candidate) => candidate.id === obligation.id)
          if (!row) return sum
          return (
            sum +
            row.payments.reduce((total, payment) => {
              const inPeriod =
                (!normalized.from ||
                  payment.occurredAt >=
                    new Date(`${normalized.from}T00:00:00.000Z`)) &&
                (!normalized.to ||
                  payment.occurredAt <=
                    new Date(`${normalized.to}T23:59:59.999Z`))
              if (!inPeriod) return total
              if (methodFilter && payment.method !== methodFilter) return total
              return payment.type === 'PAYMENT'
                ? total + payment.amount
                : total - payment.amount
            }, 0)
          )
        }, 0),
      },
    }
  },

  async getById(id: string): Promise<{ data: PaymentDetail }> {
    const row = await paymentsRepository.findById(id)
    if (!row) throw new AppError(404, 'SALE_NOT_FOUND', 'Venta no encontrada.')
    return { data: toDetail(row) }
  },

  async registerPayment(
    saleId: string,
    input: PaymentRegisterInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<{ data: PaymentDetail }> {
    const row = await paymentsRepository.registerPayment(
      saleId,
      input,
      actor,
      context,
    )
    return { data: toDetail(row) }
  },

  async compensatePayment(
    paymentId: string,
    input: PaymentCompensateInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ): Promise<{ data: PaymentDetail }> {
    const row = await paymentsRepository.compensatePayment(
      paymentId,
      input,
      actor,
      context,
    )
    return { data: toDetail(row) }
  },
}
