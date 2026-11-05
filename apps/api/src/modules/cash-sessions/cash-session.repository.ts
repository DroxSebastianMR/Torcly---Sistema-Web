import type { AuditEventType, Prisma } from '../../generated/prisma/client.js'
import { databaseService } from '../../infrastructure/database/prisma.service.js'
import { AppError } from '../../shared/errors/app-error.js'
import type { RequestContext } from '../auth/auth.types.js'
import {
  addMethodAmount,
  assertClosingNotes,
  assertNonNegativeCashAmount,
  roundCash,
  subtractMethodTotals,
  zeroMethodTotals,
} from './cash-session.rules.js'
import type {
  CashSessionCloseInput,
  CashSessionListFilters,
  CashSessionOpenInput,
  CashSessionTotals,
} from './cash-session.types.js'

type Actor = { id: string; name: string }

const sessionSelect = {
  id: true,
  organizationId: true,
  code: true,
  status: true,
  openingAmount: true,
  openingNotes: true,
  openedBy: true,
  openedAt: true,
  expectedCashAmount: true,
  countedCashAmount: true,
  differenceAmount: true,
  closingNotes: true,
  closedBy: true,
  closedAt: true,
} satisfies Prisma.CashSessionSelect

export type CashSessionRow = Prisma.CashSessionGetPayload<{
  select: typeof sessionSelect
}>

export async function lockCashSession(
  transaction: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`torcly:cash-session:${organizationId}`}))`
}

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

async function nextCode(
  transaction: Prisma.TransactionClient,
): Promise<string> {
  const rows = await transaction.$queryRaw<
    Array<{ seq: number | string }>
  >`SELECT nextval('"cash_sessions_code_seq"') AS seq`
  return `CAJA-${String(Number(rows[0].seq)).padStart(6, '0')}`
}

async function totalsFor(
  transaction: Prisma.TransactionClient,
  sessionId: string,
  organizationId: string,
): Promise<CashSessionTotals> {
  const rows = await transaction.payment.findMany({
    where: { cashSessionId: sessionId, organizationId },
    select: { type: true, method: true, amount: true },
  })
  const payments = zeroMethodTotals()
  const compensations = zeroMethodTotals()
  for (const row of rows) {
    const target = row.type === 'PAYMENT' ? payments : compensations
    Object.assign(
      target,
      addMethodAmount(target, row.method, Number(row.amount)),
    )
  }
  const net = subtractMethodTotals(payments, compensations)
  return {
    payments,
    compensations,
    net,
    expectedCashAmount: net.cash,
  }
}

export const cashSessionsRepository = {
  async current(organizationId: string): Promise<{
    row: CashSessionRow
    totals: CashSessionTotals
  } | null> {
    const row = await databaseService.client.cashSession.findFirst({
      where: { status: 'OPEN', organizationId },
      select: sessionSelect,
    })
    if (!row) return null
    const totals = await databaseService.transaction((transaction) =>
      totalsFor(transaction, row.id, organizationId),
    )
    return { row, totals }
  },

  async findById(
    id: string,
    organizationId: string,
  ): Promise<{ row: CashSessionRow; totals: CashSessionTotals } | null> {
    const row = await databaseService.client.cashSession.findFirst({
      where: { id, organizationId },
      select: sessionSelect,
    })
    if (!row) return null
    const totals = await databaseService.transaction((transaction) =>
      totalsFor(transaction, id, organizationId),
    )
    return { row, totals }
  },

  async listClosed(filters: CashSessionListFilters, organizationId: string) {
    const total = await databaseService.client.cashSession.count({
      where: { status: 'CLOSED', organizationId },
    })
    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
    const page = Math.min(filters.page, totalPages)
    const rows = await databaseService.client.cashSession.findMany({
      where: { status: 'CLOSED', organizationId },
      select: sessionSelect,
      orderBy: { closedAt: 'desc' },
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
    })
    const totals = await databaseService.transaction(async (transaction) =>
      Promise.all(
        rows.map((row) => totalsFor(transaction, row.id, organizationId)),
      ),
    )
    return {
      total,
      page,
      rows: rows.map((row, index) => ({ row, totals: totals[index] })),
    }
  },

  async requireOpenSession(
    transaction: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<CashSessionRow> {
    const row = await transaction.cashSession.findFirst({
      where: { status: 'OPEN', organizationId },
      select: sessionSelect,
    })
    if (!row) {
      throw new AppError(
        409,
        'CASH_SESSION_NOT_OPEN',
        'Debes abrir una caja antes de registrar un cobro o compensación.',
      )
    }
    return row
  },

  async open(
    input: CashSessionOpenInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ): Promise<{ row: CashSessionRow; totals: CashSessionTotals }> {
    return databaseService.transaction(async (transaction) => {
      await lockCashSession(transaction, organizationId)
      const openingIdempotencyKey = `cash-session:open:${input.requestId}`
      const replay = await transaction.cashSession.findUnique({
        where: { openingIdempotencyKey },
        select: sessionSelect,
      })
      if (replay) {
        if (replay.organizationId !== organizationId) {
          throw new AppError(
            409,
            'IDEMPOTENCY_KEY_CONFLICT',
            'La solicitud ya fue usada en otra organización.',
          )
        }
        return {
          row: replay,
          totals: await totalsFor(transaction, replay.id, organizationId),
        }
      }

      const current = await transaction.cashSession.findFirst({
        where: { status: 'OPEN', organizationId },
        select: { code: true },
      })
      if (current) {
        throw new AppError(
          409,
          'CASH_SESSION_ALREADY_OPEN',
          `La caja ${current.code} sigue abierta. Debes cerrarla antes de abrir otra.`,
        )
      }
      assertNonNegativeCashAmount(input.openingAmount)
      const code = await nextCode(transaction)
      const row = await transaction.cashSession.create({
        data: {
          organizationId,
          code,
          status: 'OPEN',
          openingAmount: input.openingAmount,
          openingNotes: input.notes?.trim() || null,
          openedBy: actor.name,
          openingIdempotencyKey,
        },
        select: sessionSelect,
      })
      await transaction.auditLog.create({
        data: auditData('CASH_SESSION_OPENED', actor.id, code, context, {
          cashSessionId: row.id,
          code,
          openingAmount: input.openingAmount,
        }),
      })
      return {
        row,
        totals: {
          payments: zeroMethodTotals(),
          compensations: zeroMethodTotals(),
          net: zeroMethodTotals(),
          expectedCashAmount: 0,
        },
      }
    })
  },

  async close(
    id: string,
    input: CashSessionCloseInput,
    actor: Actor,
    context: RequestContext,
    organizationId: string,
  ): Promise<{ row: CashSessionRow; totals: CashSessionTotals }> {
    return databaseService.transaction(async (transaction) => {
      await lockCashSession(transaction, organizationId)
      const closingIdempotencyKey = `cash-session:close:${id}:${input.requestId}`
      const replay = await transaction.cashSession.findUnique({
        where: { closingIdempotencyKey },
        select: sessionSelect,
      })
      if (replay) {
        if (replay.organizationId !== organizationId) {
          throw new AppError(
            404,
            'CASH_SESSION_NOT_FOUND',
            'Caja no encontrada.',
          )
        }
        return {
          row: replay,
          totals: await totalsFor(transaction, replay.id, organizationId),
        }
      }

      const session = await transaction.cashSession.findFirst({
        where: { id, organizationId },
        select: sessionSelect,
      })
      if (!session)
        throw new AppError(404, 'CASH_SESSION_NOT_FOUND', 'Caja no encontrada.')
      if (session.status !== 'OPEN') {
        throw new AppError(
          409,
          'CASH_SESSION_ALREADY_CLOSED',
          'Esta caja ya fue cerrada.',
        )
      }
      assertNonNegativeCashAmount(input.countedCashAmount)
      const totals = await totalsFor(transaction, id, organizationId)
      const expectedCashAmount = roundCash(
        Number(session.openingAmount) + totals.expectedCashAmount,
      )
      const differenceAmount = roundCash(
        input.countedCashAmount - expectedCashAmount,
      )
      assertClosingNotes(differenceAmount, input.notes)
      const row = await transaction.cashSession.update({
        where: { id },
        data: {
          status: 'CLOSED',
          expectedCashAmount,
          countedCashAmount: input.countedCashAmount,
          differenceAmount,
          closingNotes: input.notes?.trim() || null,
          closedBy: actor.name,
          closedAt: new Date(),
          closingIdempotencyKey,
        },
        select: sessionSelect,
      })
      await transaction.auditLog.create({
        data: auditData('CASH_SESSION_CLOSED', actor.id, row.code, context, {
          cashSessionId: row.id,
          code: row.code,
          expectedCashAmount,
          countedCashAmount: input.countedCashAmount,
          differenceAmount,
        }),
      })
      return { row, totals }
    })
  },
}
