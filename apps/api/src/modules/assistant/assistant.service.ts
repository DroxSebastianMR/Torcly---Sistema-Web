import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/app-error.js'
import { authorizedSections } from '../operations/operations.rules.js'
import { operationsService } from '../operations/operations.service.js'
import { FakeProvider, GroqProvider } from './ai.provider.js'
import { assistantRepository } from './assistant.repository.js'
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
  return new GroqProvider(
    env.GROQ_API_KEY,
    env.AI_REQUEST_TIMEOUT_MS,
    env.GROQ_MODEL,
    env.AI_MAX_OUTPUT_TOKENS,
  )
}

async function buildContext(
  filters: { from: string | null; to: string | null },
  permissions: readonly string[],
): Promise<AssistantContext> {
  const summary = await operationsService.getSummary(filters, permissions)
  const sections = authorizedSections(permissions)
  const attentionEntries = await Promise.all(
    sections.map(async (section) => {
      const response = await operationsService.getAttention(
        section,
        { ...filters, page: 1, pageSize: 10 },
        permissions,
      )
      return [section, response.data] as const
    }),
  )
  const attention = Object.fromEntries(attentionEntries)
  const facts: Record<string, unknown> = {
    operations: {
      summary: summary.sections,
      attention,
    },
  }
  const sources: AssistantSource[] = sections.map((section) => ({
    module: section,
    ...sourcePaths[section],
  }))
  if (permissions.includes('inventory:read')) {
    facts.inventory = {
      summary: summary.sections.inventory,
      lowStockItems: attention.inventory ?? [],
    }
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
    input: {
      message: string
      from: string | null
      to: string | null
      conversationId?: string
    },
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
    const history = input.conversationId
      ? await assistantRepository.getRecentMessages(
          actor.id,
          input.conversationId,
        )
      : []
    if (history === null) {
      throw new AppError(
        404,
        'ASSISTANT_CONVERSATION_NOT_FOUND',
        'No se encontró la conversación solicitada.',
      )
    }
    const message = await activeProvider.complete({
      message: input.message,
      context,
      history,
    })
    const conversationId = await assistantRepository.saveExchange({
      userId: actor.id,
      conversationId: input.conversationId,
      question: input.message,
      answer: message,
    })
    if (!conversationId) {
      throw new AppError(
        404,
        'ASSISTANT_CONVERSATION_NOT_FOUND',
        'No se encontró la conversación solicitada.',
      )
    }
    return {
      conversationId,
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
  async listConversations(userId: string) {
    const conversations = await assistantRepository.listConversations(userId)
    return conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt.toISOString(),
      preview: conversation.messages[0]?.content ?? null,
    }))
  },
  async getConversation(userId: string, id: string) {
    const conversation = await assistantRepository.getConversation(userId, id)
    if (!conversation) {
      throw new AppError(
        404,
        'ASSISTANT_CONVERSATION_NOT_FOUND',
        'No se encontró la conversación solicitada.',
      )
    }
    return {
      ...conversation,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      messages: conversation.messages.map((message) => ({
        ...message,
        createdAt: message.createdAt.toISOString(),
      })),
    }
  },
}
