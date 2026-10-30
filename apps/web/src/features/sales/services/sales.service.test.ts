import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { salesService } from './sales.service'

describe('Servicio de ventas (web)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lista usa el estado, la paginación y la búsqueda', async () => {
    await salesService.list({
      search: 'aceite',
      status: 'DRAFT',
      page: 2,
      pageSize: 30,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/sales?status=DRAFT&page=2&pageSize=30&search=aceite',
      undefined,
    )
  })

  it('omite la búsqueda vacía en el query string', async () => {
    await salesService.list({
      search: '   ',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/sales?status=all&page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el detalle y el catálogo de venta', async () => {
    await salesService.get('s1')
    expect(api.get).toHaveBeenCalledWith('/sales/s1', undefined)

    await salesService.catalog()
    expect(api.get).toHaveBeenCalledWith('/sales/catalogo', undefined)
  })

  it('crea, confirma y anula ventas en los endpoints correctos', async () => {
    const input = {
      customerId: 'c1',
      lines: [{ type: 'PRODUCT' as const, productId: 'p1', quantity: 2 }],
    }

    await salesService.create(input)
    expect(api.post).toHaveBeenCalledWith('/sales', input)

    await salesService.createConfirmed(input)
    expect(api.post).toHaveBeenCalledWith('/sales', { ...input, confirm: true })

    await salesService.update('s1', input)
    expect(api.put).toHaveBeenCalledWith('/sales/s1', input)

    await salesService.confirm('s1')
    expect(api.post).toHaveBeenCalledWith('/sales/s1/confirm')

    await salesService.cancel('s1', { reason: 'Cliente desistió.' })
    expect(api.post).toHaveBeenCalledWith('/sales/s1/cancel', {
      reason: 'Cliente desistió.',
    })
  })
})
