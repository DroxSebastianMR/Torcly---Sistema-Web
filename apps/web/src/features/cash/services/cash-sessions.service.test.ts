import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { cashSessionsService } from './cash-sessions.service'

describe('Servicio de sesiones de caja (web)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.get.mockResolvedValue({ data: null })
    api.post.mockResolvedValue({ data: {} })
  })

  afterEach(() => vi.clearAllMocks())

  it('consulta caja actual e historial paginado', async () => {
    await cashSessionsService.current()
    expect(api.get).toHaveBeenCalledWith('/cash-sessions/current', undefined)

    await cashSessionsService.list({ page: 2, pageSize: 10 })
    expect(api.get).toHaveBeenCalledWith(
      '/cash-sessions?page=2&pageSize=10',
      undefined,
    )
  })

  it('abre y cierra caja en sus endpoints protegidos', async () => {
    await cashSessionsService.open({
      requestId: 'req-open',
      openingAmount: 50,
    })
    expect(api.post).toHaveBeenCalledWith('/cash-sessions/open', {
      requestId: 'req-open',
      openingAmount: 50,
    })

    await cashSessionsService.close('caja-1', {
      requestId: 'req-close',
      countedCashAmount: 70,
      notes: 'Arqueo semanal',
    })
    expect(api.post).toHaveBeenCalledWith('/cash-sessions/caja-1/close', {
      requestId: 'req-close',
      countedCashAmount: 70,
      notes: 'Arqueo semanal',
    })
  })
})
