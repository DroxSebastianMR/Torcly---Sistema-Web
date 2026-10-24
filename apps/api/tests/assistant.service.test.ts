import { beforeEach, describe, expect, it, vi } from 'vitest'

const operations = vi.hoisted(() => ({ getSummary: vi.fn() }))
const replenishment = vi.hoisted(() => ({ getEligibility: vi.fn() }))

vi.mock('../src/modules/operations/operations.service.js', () => ({
  operationsService: operations,
}))
vi.mock('../src/modules/replenishment/replenishment.service.js', () => ({
  replenishmentService: replenishment,
}))

import { assistantService } from '../src/modules/assistant/assistant.service.js'

beforeEach(() => {
  assistantService.resetRateLimits()
  operations.getSummary.mockReset().mockResolvedValue({
    generatedAt: '2026-10-24T00:00:00.000Z',
    period: { from: null, to: null },
    sections: { sales: { confirmedCount: 2, confirmedAmount: 100 } },
  })
  replenishment.getEligibility.mockReset().mockResolvedValue({
    counts: {
      total: 0,
      eligible: 0,
      notEligible: 0,
      critical: 0,
      advisable: 0,
    },
    items: [],
  })
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
    expect(replenishment.getEligibility).not.toHaveBeenCalled()
    expect(result.sources).toEqual([
      { module: 'sales', label: 'Ventas', path: '/ventas' },
    ])
    expect(result.message).toContain('Ventas')
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
