import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/app-error.js'
import { authorizedSections } from '../operations/operations.rules.js'
import { operationsService } from '../operations/operations.service.js'
import { replenishmentService } from '../replenishment/replenishment.service.js'
import { REPLENISHMENT_DEFAULT_COVERAGE_DAYS } from '../replenishment/replenishment.types.js'
import { FakeProvider, GroqProvider } from './ai.provider.js'
import type {
  AiProvider,
  AssistantAnswer,
  AssistantContext,
  AssistantSource,
} from './assistant.types.js'

const readOnlyPattern =
  /\b(crea|crear|registre|registrar|edita|editar|modifica|modificar|cancela|cancelar|paga|pagar|cobra|cobrar|elimina|eliminar|ajusta|ajustar)\b|\b(haz|realiza|efectúa)\b.{0,30}\b(pago|compra|venta|ajuste|movimiento)\b/i
const rateWindows = new Map<string, { startedAt: number; count: number }>()

const sourcePaths: Record<string, { label: string; path: string }> = {
  appointments: { label: 'Citas', path: '/citas' },
  workOrders: { label: 'Órdenes de taller', path: '/ordenes-taller' },
  sales: { label: 'Ventas', path: '/ventas' },
  payments: { label: 'Caja', path: '/caja' },
  inventory: { label: 'Inventario', path: '/inventario' },
  replenishment: { label: 'Reabastecimiento', path: '/reabastecimiento' },
}

function assertReadOnly(message: string): void {
  if (readOnlyPattern.test(message)) {
    throw new AppError(
      400,
      'ASSISTANT_READ_ONLY',
      'El asistente solo responde consultas y recomendaciones; no ejecuta ni indica acciones operativas.',
    )
  }
}

function consumeRateLimit(userId: string): void {
  const now = Date.now()
  const previous = rateWindows.get(userId)
  const current =
    !previous || now - previous.startedAt >= 60_000
      ? { startedAt: now, count: 0 }
      : previous
  if (current.count >= env.AI_RATE_LIMIT_PER_MINUTE) {
    throw new AppError(
      429,
      'ASSISTANT_RATE_LIMITED',
      'Has alcanzado el límite temporal de consultas al asistente.',
    )
  }
  current.count += 1
  rateWindows.set(userId, current)
}

function provider(): AiProvider | null {
  if (env.AI_PROVIDER === 'fake' || env.NODE_ENV === 'test')
    return new FakeProvider()
  if (!env.GROQ_API_KEY) return null
  return new GroqProvider(env.GROQ_API_KEY, env.AI_REQUEST_TIMEOUT_MS)
}

async function buildContext(
  filters: { from: string | null; to: string | null },
  permissions: readonly string[],
): Promise<AssistantContext> {
  const summary = await operationsService.getSummary(filters, permissions)
  const facts: Record<string, unknown> = { operations: summary.sections }
  const sources: AssistantSource[] = authorizedSections(permissions).map(
    (section) => ({
      module: section,
      ...sourcePaths[section],
    }),
  )
  if (permissions.includes('inventory:read')) {
    const eligibility = await replenishmentService.getEligibility({
      ...filters,
      search: null,
      priority: null,
      eligible: true,
      page: 1,
      pageSize: 5,
      coverageDays: REPLENISHMENT_DEFAULT_COVERAGE_DAYS,
    })
    facts.replenishment = {
      counts: eligibility.counts,
      items: eligibility.items.map((item) => ({
        code: item.code,
        stockCurrent: item.stockCurrent,
        minimumStock: item.minimumStock,
        suggestedQuantity: item.suggestedQuantity,
        priority: item.priority,
      })),
    }
    sources.push({ module: 'replenishment', ...sourcePaths.replenishment })
  }
  return {
    generatedAt: summary.generatedAt,
    period: summary.period,
    sources,
    facts,
  }
}

export const assistantService = {
  async ask(
    input: { message: string; from: string | null; to: string | null },
    actor: { id: string; permissions: readonly string[] },
  ): Promise<AssistantAnswer> {
    assertReadOnly(input.message)
    consumeRateLimit(actor.id)
    const activeProvider = provider()
    if (!activeProvider) {
      throw new AppError(
        503,
        'ASSISTANT_NOT_CONFIGURED',
        'El asistente no está configurado en este entorno.',
      )
    }
    const context = await buildContext(
      { from: input.from, to: input.to },
      actor.permissions,
    )
    const message = await activeProvider.complete({
      message: input.message,
      context,
    })
    return {
      message,
      generatedAt: context.generatedAt,
      period: context.period,
      sources: context.sources,
      disclaimer:
        'Orientación basada únicamente en datos agregados autorizados. Verifica el detalle en los módulos fuente.',
    }
  },
  resetRateLimits() {
    rateWindows.clear()
  },
}
