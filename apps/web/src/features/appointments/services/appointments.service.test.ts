import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { appointmentsService } from './appointments.service'

describe('Servicio de citas (web)', () => {
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

  it('lista con búsqueda, fecha, cliente, estado y paginación', async () => {
    await appointmentsService.list({
      search: 'aceite',
      date: '2026-01-02',
      customerId: 'c1',
      status: 'PROGRAMADA',
      page: 2,
      pageSize: 30,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/appointments?page=2&pageSize=30&search=aceite&date=2026-01-02&customerId=c1&status=PROGRAMADA',
      undefined,
    )
  })

  it('omite los filtros vacíos en el query string', async () => {
    await appointmentsService.list({
      search: '   ',
      date: '',
      customerId: '',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/appointments?page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el detalle de una cita', async () => {
    await appointmentsService.get('a1')

    expect(api.get).toHaveBeenCalledWith('/appointments/a1', undefined)
  })

  it('crea, reprograma y cancela en los endpoints correctos', async () => {
    const input = {
      customerId: 'c1',
      vehicleId: 'v1',
      date: '2099-12-31',
      time: '10:00',
      reason: 'Cambio de aceite',
    }

    await appointmentsService.create(input)
    expect(api.post).toHaveBeenCalledWith('/appointments', input)

    await appointmentsService.reschedule('a1', {
      date: '2099-12-31',
      time: '10:00',
    })
    expect(api.put).toHaveBeenCalledWith('/appointments/a1/reschedule', {
      date: '2099-12-31',
      time: '10:00',
    })

    await appointmentsService.cancel('a1')
    expect(api.post).toHaveBeenCalledWith('/appointments/a1/cancel')
  })
})
