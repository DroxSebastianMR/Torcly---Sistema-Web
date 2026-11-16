import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { quotationsService } from './quotations.service'

describe('Servicio de cotizaciones (web)', () => {
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

  it('lista con filtros de estado, búsqueda y paginación', async () => {
    await quotationsService.list({
      search: 'frenos',
      status: 'DRAFT',
      page: 1,
      pageSize: 10,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/quotations?status=DRAFT&page=1&pageSize=10&search=frenos',
      undefined,
    )
  })

  it('omite la búsqueda si está vacía', async () => {
    await quotationsService.list({
      search: '   ',
      status: 'all',
      page: 1,
      pageSize: 10,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/quotations?status=all&page=1&pageSize=10',
      undefined,
    )
  })

  it('obtiene el detalle de una cotización', async () => {
    await quotationsService.get('q-1')
    expect(api.get).toHaveBeenCalledWith('/quotations/q-1', undefined)
  })

  it('crea, actualiza y convierte presupuestos', async () => {
    const input = {
      customerId: 'c-1',
      vehicleId: 'v-1',
      items: [
        {
          type: 'PRODUCT' as const,
          productId: 'p-1',
          name: 'Pastillas de freno',
          unitPrice: 120,
          quantity: 2,
        },
      ],
    }

    await quotationsService.create(input)
    expect(api.post).toHaveBeenCalledWith('/quotations', input)

    await quotationsService.update('q-1', input)
    expect(api.put).toHaveBeenCalledWith('/quotations/q-1', input)

    const conversionInput = {
      mode: 'EXISTING' as const,
      customerId: 'c-1',
      vehicleId: 'v-1',
    }
    await quotationsService.convertToOrder('q-1', conversionInput)
    expect(api.post).toHaveBeenCalledWith(
      '/quotations/q-1/convert-to-order',
      conversionInput,
    )
  })
})
