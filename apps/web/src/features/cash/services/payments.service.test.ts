import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { paymentsService } from './payments.service'

describe('Servicio de cobros (web)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lista usa estado, método, paginación, búsqueda y rango de fechas', async () => {
    await paymentsService.list({
      search: 'aceite',
      status: 'PARTIALLY_PAID',
      method: 'CARD',
      from: '2026-10-01',
      to: '2026-10-31',
      page: 2,
      pageSize: 30,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/payments?status=PARTIALLY_PAID&method=CARD&page=2&pageSize=30&search=aceite&from=2026-10-01&to=2026-10-31',
      undefined,
    )
  })

  it('omite búsqueda vacía y fechas sin valor en el query string', async () => {
    await paymentsService.list({
      search: '   ',
      status: 'all',
      method: 'all',
      from: null,
      to: null,
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/payments?status=all&method=all&page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el detalle de una obligación', async () => {
    await paymentsService.get('s1')
    expect(api.get).toHaveBeenCalledWith('/payments/s1', undefined)
  })

  it('registra pagos y compensaciones en los endpoints correctos', async () => {
    await paymentsService.pay('s1', {
      requestId: 'req-1',
      amount: 50,
      method: 'CASH',
    })
    expect(api.post).toHaveBeenCalledWith('/payments/s1/pay', {
      requestId: 'req-1',
      amount: 50,
      method: 'CASH',
    })

    await paymentsService.compensate('p1', {
      requestId: 'req-2',
      amount: 20,
      reason: 'Cobro duplicado',
    })
    expect(api.post).toHaveBeenCalledWith('/payments/p1/compensate', {
      requestId: 'req-2',
      amount: 20,
      reason: 'Cobro duplicado',
    })
  })
})
