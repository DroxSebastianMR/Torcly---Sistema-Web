import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { servicesService } from './services.service'

describe('Servicio de servicios (web)', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.put.mockReset()
    api.patch.mockReset()
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({ data: {} })
    api.put.mockResolvedValue({ data: {} })
    api.patch.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('listar usa el estado, la paginación y la búsqueda', async () => {
    await servicesService.list({
      search: 'cambio',
      status: 'active',
      page: 2,
      pageSize: 30,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/services?status=active&page=2&pageSize=30&search=cambio',
      undefined,
    )
  })

  it('omite la búsqueda vacía en el query string', async () => {
    await servicesService.list({
      search: '   ',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/services?status=all&page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta opciones y el detalle de un servicio', async () => {
    await servicesService.options()
    expect(api.get).toHaveBeenCalledWith('/services/options', undefined)

    await servicesService.get('sv1')
    expect(api.get).toHaveBeenCalledWith('/services/sv1', undefined)
  })

  it('crea, actualiza y cambia el estado con los endpoints correctos', async () => {
    const input = {
      code: 'CAMBIO-BOMBA',
      name: 'Cambio de bomba de agua',
      description: null,
      price: 250.5,
    }

    await servicesService.create(input)
    expect(api.post).toHaveBeenCalledWith('/services', input)

    await servicesService.update('sv1', input)
    expect(api.put).toHaveBeenCalledWith('/services/sv1', input)

    await servicesService.updateStatus('sv1', false)
    expect(api.patch).toHaveBeenCalledWith('/services/sv1/status', {
      active: false,
    })
  })
})
