import { beforeEach, describe, expect, it, vi } from 'vitest'

const operations = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getAttention: vi.fn(),
}))
const conversations = vi.hoisted(() => ({
  saveExchange: vi.fn(),
  listConversations: vi.fn(),
  getConversation: vi.fn(),
  getRecentMessages: vi.fn(),
}))

vi.mock('../src/modules/operations/operations.service.js', () => ({
  operationsService: operations,
}))
vi.mock('../src/modules/assistant/assistant.repository.js', () => ({
  assistantRepository: conversations,
}))

import { assistantService } from '../src/modules/assistant/assistant.service.js'

beforeEach(() => {
  assistantService.resetRateLimits()
  operations.getSummary.mockReset().mockResolvedValue({
    generatedAt: '2026-10-24T00:00:00.000Z',
    period: { from: null, to: null },
    sections: { sales: { confirmedCount: 2, confirmedAmount: 100 } },
  })
  conversations.saveExchange.mockReset().mockResolvedValue('conversation-1')
  conversations.listConversations.mockReset()
  conversations.getConversation.mockReset()
  conversations.getRecentMessages.mockReset().mockResolvedValue([])
  operations.getAttention.mockReset().mockResolvedValue({ data: [] })
})

describe('Servicio del asistente', () => {
  it('genera contexto agregado solo de las fuentes autorizadas', async () => {
    const result = await assistantService.ask(
      { message: '¿Cómo van las ventas?', from: null, to: null },
      { id: 'user-1', permissions: ['sales:read'] },
    )
    expect(operations.getSummary).toHaveBeenCalledWith(
      { from: null, to: null },
      ['sales:read'],
    )
    expect(operations.getAttention).toHaveBeenCalledWith(
      'sales',
      { from: null, to: null, page: 1, pageSize: 10 },
      ['sales:read'],
    )
    expect(result.sources).toEqual([
      { module: 'sales', label: 'Ventas', path: '/ventas' },
    ])
    expect(result.conversationId).toBe('conversation-1')
    expect(result.message).toContain('Ventas')
  })

  it('incluye los elementos operativos relevantes de cada sección permitida', async () => {
    await assistantService.ask(
      { message: '¿Qué necesita atención?', from: null, to: null },
      {
        id: 'user-1',
        permissions: ['appointments:read', 'workshop:read', 'inventory:read'],
      },
    )

    expect(operations.getAttention).toHaveBeenCalledWith(
      'appointments',
      { from: null, to: null, page: 1, pageSize: 10 },
      ['appointments:read', 'workshop:read', 'inventory:read'],
    )
    expect(operations.getAttention).toHaveBeenCalledWith(
      'workOrders',
      { from: null, to: null, page: 1, pageSize: 10 },
      ['appointments:read', 'workshop:read', 'inventory:read'],
    )
    expect(operations.getAttention).toHaveBeenCalledWith(
      'inventory',
      { from: null, to: null, page: 1, pageSize: 10 },
      ['appointments:read', 'workshop:read', 'inventory:read'],
    )
  })

  it('rechaza pedidos mutantes antes de consultar datos o proveedor', async () => {
    await expect(
      assistantService.ask(
        { message: 'Cancela la cita de mañana', from: null, to: null },
        { id: 'user-1', permissions: ['appointments:read'] },
      ),
    ).rejects.toMatchObject({ code: 'ASSISTANT_READ_ONLY' })
    expect(operations.getSummary).not.toHaveBeenCalled()
  })
})
