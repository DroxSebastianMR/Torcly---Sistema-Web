import { AppError } from '../../shared/errors/app-error.js'
import { roundCash } from './cash-session.rules.js'
import {
  cashSessionsRepository,
  type CashSessionRow,
} from './cash-session.repository.js'
import type {
  CashSessionCloseInput,
  CashSessionListFilters,
  CashSessionListResponse,
  CashSessionOpenInput,
  CashSessionSummary,
  CashSessionTotals,
} from './cash-session.types.js'
import type { RequestContext } from '../auth/auth.types.js'

function serialize(
  row: CashSessionRow,
  totals: CashSessionTotals,
): CashSessionSummary {
  const expectedCashAmount =
    row.expectedCashAmount === null ? null : Number(row.expectedCashAmount)
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    openingAmount: Number(row.openingAmount),
    openingNotes: row.openingNotes,
    openedBy: row.openedBy,
    openedAt: row.openedAt.toISOString(),
    expectedCashAmount,
    countedCashAmount:
      row.countedCashAmount === null ? null : Number(row.countedCashAmount),
    differenceAmount:
      row.differenceAmount === null ? null : Number(row.differenceAmount),
    closingNotes: row.closingNotes,
    closedBy: row.closedBy,
    closedAt: row.closedAt?.toISOString() ?? null,
    totals: {
      ...totals,
      expectedCashAmount:
        row.status === 'CLOSED' && expectedCashAmount !== null
          ? expectedCashAmount
          : roundCash(Number(row.openingAmount) + totals.expectedCashAmount),
    },
  }
}

export const cashSessionsService = {
  async current() {
    const result = await cashSessionsRepository.current()
    return { data: result ? serialize(result.row, result.totals) : null }
  },

  async getById(id: string) {
    const result = await cashSessionsRepository.findById(id)
    if (!result)
      throw new AppError(404, 'CASH_SESSION_NOT_FOUND', 'Caja no encontrada.')
    return { data: serialize(result.row, result.totals) }
  },

  async list(
    filters: CashSessionListFilters,
  ): Promise<CashSessionListResponse> {
    const result = await cashSessionsRepository.listClosed(filters)
    const totalPages = Math.max(1, Math.ceil(result.total / filters.pageSize))
    return {
      data: result.rows.map(({ row, totals }) => serialize(row, totals)),
      pagination: {
        page: result.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages,
      },
    }
  },

  async open(
    input: CashSessionOpenInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const result = await cashSessionsRepository.open(input, actor, context)
    return { data: serialize(result.row, result.totals) }
  },

  async close(
    id: string,
    input: CashSessionCloseInput,
    actor: { id: string; name: string },
    context: RequestContext,
  ) {
    const result = await cashSessionsRepository.close(id, input, actor, context)
    return { data: serialize(result.row, result.totals) }
  },
}
