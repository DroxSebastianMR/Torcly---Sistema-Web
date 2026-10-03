import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { workOrdersService } from './work-orders.service'

describe('Servicio de órdenes de taller (web)', () => {
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

  it('lista usa estado, paginación, búsqueda y técnico', async () => {
    await workOrdersService.list({
      search: 'ABC-123',
      status: 'EN_DIAGNOSTICO',
      technicianId: 'u1',
      page: 2,
      pageSize: 30,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/work-orders?status=EN_DIAGNOSTICO&page=2&pageSize=30&search=ABC-123&technicianId=u1',
      undefined,
    )
  })

  it('omite búsqueda vacía y técnico no seleccionado en el query string', async () => {
    await workOrdersService.list({
      search: '   ',
      status: 'all',
      technicianId: '',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/work-orders?status=all&page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta el detalle, el catálogo y los técnicos', async () => {
    await workOrdersService.get('wo1')
    expect(api.get).toHaveBeenCalledWith('/work-orders/wo1', undefined)

    await workOrdersService.catalog()
    expect(api.get).toHaveBeenCalledWith('/work-orders/catalog', undefined)

    await workOrdersService.technicians()
    expect(api.get).toHaveBeenCalledWith('/work-orders/technicians', undefined)
  })

  it('crea una orden desde la cita atendida', async () => {
    await workOrdersService.createFromAppointment('a1')
    expect(api.post).toHaveBeenCalledWith('/work-orders', {
      appointmentId: 'a1',
    })
  })

  it('actualiza diagnóstico, presupuesto, envío, decisión y técnico', async () => {
    await workOrdersService.updateDiagnosis('wo1', 'Falla en frenos')
    expect(api.put).toHaveBeenCalledWith('/work-orders/wo1/diagnosis', {
      diagnosis: 'Falla en frenos',
    })

    const budget = {
      lines: [{ type: 'PRODUCT' as const, productId: 'p1', quantity: 2 }],
    }
    await workOrdersService.saveBudget('wo1', budget)
    expect(api.put).toHaveBeenCalledWith('/work-orders/wo1/budget', budget)

    await workOrdersService.sendBudget('wo1')
    expect(api.post).toHaveBeenCalledWith('/work-orders/wo1/budget/send')

    const decision = { decision: 'APPROVED' as const }
    await workOrdersService.decide('wo1', decision)
    expect(api.post).toHaveBeenCalledWith('/work-orders/wo1/decision', decision)

    await workOrdersService.assignTechnician('wo1', 'u1')
    expect(api.put).toHaveBeenCalledWith('/work-orders/wo1/technician', {
      technicianId: 'u1',
    })
  })

  it('inicia, consulta y gestiona la ejecución de una orden', async () => {
    await workOrdersService.startExecution('wo1')
    expect(api.post).toHaveBeenCalledWith('/work-orders/wo1/execution/start', {})

    await workOrdersService.execution('wo1')
    expect(api.get).toHaveBeenCalledWith(
      '/work-orders/wo1/execution',
      undefined,
    )

    await workOrdersService.createActivity('wo1', {
      description: 'Revisar frenos',
    })
    expect(api.post).toHaveBeenCalledWith('/work-orders/wo1/activities', {
      description: 'Revisar frenos',
    })

    await workOrdersService.completeActivity('wo1', 'act1')
    expect(api.post).toHaveBeenCalledWith(
      '/work-orders/wo1/activities/act1/complete',
      {},
    )
  })

  it('consume y devuelve repuestos, finaliza y entrega', async () => {
    const consumption = {
      requestId: 'rid',
      items: [{ lineId: 'l1', quantity: 2 }],
    }
    await workOrdersService.consume('wo1', consumption)
    expect(api.post).toHaveBeenCalledWith(
      '/work-orders/wo1/consumptions',
      consumption,
    )

    const returnInput = {
      requestId: 'rid2',
      items: [{ lineId: 'l1', quantity: 1, notes: 'Sobró' }],
    }
    await workOrdersService.returnProducts('wo1', returnInput)
    expect(api.post).toHaveBeenCalledWith(
      '/work-orders/wo1/returns',
      returnInput,
    )

    await workOrdersService.finalize('wo1')
    expect(api.post).toHaveBeenCalledWith('/work-orders/wo1/finalize', {})

    await workOrdersService.deliver('wo1', { notes: 'Entregado' })
    expect(api.post).toHaveBeenCalledWith('/work-orders/wo1/delivery', {
      notes: 'Entregado',
    })
  })

  it('consulta el historial técnico de un vehículo paginado', async () => {
    await workOrdersService.vehicleHistory('v1', 2, 10)
    expect(api.get).toHaveBeenCalledWith(
      '/work-orders/vehicles/v1/history?page=2&pageSize=10',
      undefined,
    )
  })
})
