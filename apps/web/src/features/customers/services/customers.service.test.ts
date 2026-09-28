import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { customersService } from './customers.service'

describe('Servicio de clientes', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.get.mockResolvedValue({ data: [] })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lista clientes con filtros y paginación', async () => {
    await customersService.list({
      search: 'maria',
      type: 'LEGAL',
      page: 2,
      pageSize: 50,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/customers?type=LEGAL&page=2&pageSize=50&search=maria',
      undefined,
    )
  })

  it('omite el search vacío en el query string', async () => {
    await customersService.list({
      search: '   ',
      type: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/customers?type=all&page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el detalle de un cliente', async () => {
    await customersService.get('c1')
    expect(api.get).toHaveBeenCalledWith('/customers/c1', undefined)
  })

  it('crea y actualiza clientes con los endpoints correctos', async () => {
    await customersService.create({
      type: 'NATURAL',
      documentNumber: '12345678',
      firstName: 'María',
      lastName: 'Pérez',
      phone: '987654321',
    })
    expect(api.post).toHaveBeenCalledWith(
      '/customers',
      expect.objectContaining({ type: 'NATURAL' }),
    )

    await customersService.update('c1', {
      type: 'LEGAL',
      documentNumber: '20123456789',
      legalName: 'Torcly Repuestos S.A.C.',
      phone: '+51987654321',
    })
    expect(api.put).toHaveBeenCalledWith(
      '/customers/c1',
      expect.objectContaining({ type: 'LEGAL' }),
    )
  })
})
