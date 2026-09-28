import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  findAppointmentToAttend: vi.fn(),
  findProductRef: vi.fn(),
  findServiceRef: vi.fn(),
  findTechnicianRef: vi.fn(),
  findUserDisplayNames: vi.fn(),
  getStats: vi.fn(),
  getCatalog: vi.fn(),
  listTechnicians: vi.fn(),
  createFromAppointment: vi.fn(),
  updateDiagnosis: vi.fn(),
  saveBudget: vi.fn(),
  sendBudget: vi.fn(),
  decide: vi.fn(),
  updateTechnician: vi.fn(),
}))

vi.mock('../src/modules/work-orders/work-order.repository.js', () => ({
  workOrdersRepository: repository,
}))

import { workOrdersService } from '../src/modules/work-orders/work-order.service.js'

const context = {
  requestId: 'req-work-order-1',
  ipAddress: '127.0.0.1',
}

const customerId = 'a0000000-0000-4000-8000-000000000001'
const vehicleId = 'a0000000-0000-4000-8000-000000000002'
const productId = 'a0000000-0000-4000-8000-000000000003'
const serviceId = 'a0000000-0000-4000-8000-000000000004'
const technicianId = 'a0000000-0000-4000-8000-000000000005'
const appointmentId = 'a0000000-0000-4000-8000-000000000006'

const customerRef = {
  id: customerId,
  documentNumber: '12345678',
  firstName: 'Ana',
  lastName: 'Pérez',
  legalName: null,
}

const vehicleRef = {
  id: vehicleId,
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2020,
}

const productRef = {
  id: productId,
  code: 'P-001',
  name: 'Aceite 5W-30',
  active: true,
  salePrice: 120.5,
  unit: { name: 'Botella', symbol: 'btl' },
}

const serviceRef = {
  id: serviceId,
  code: 'S-001',
  name: 'Cambio de aceite',
  active: true,
  price: 80,
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'work-order-1',
    code: 'OT-000001',
    appointmentId,
    customerId,
    vehicleId,
    status: 'RECEPCIONADA',
    technicianId: null,
    diagnosis: null,
    diagnosisUpdatedBy: null,
    diagnosisUpdatedAt: null,
    budgetSentBy: null,
    budgetSentAt: null,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    decisionNotes: null,
    subtotal: 0,
    total: 0,
    performedBy: 'user-1',
    createdAt: new Date('2026-09-25T00:00:00.000Z'),
    updatedAt: new Date('2026-09-25T00:00:00.000Z'),
    appointment: {
      id: appointmentId,
      code: 'CITA-000001',
    },
    customer: customerRef,
    vehicle: vehicleRef,
    technician: null,
    _count: { lines: 0 },
    lines: [],
    ...overrides,
  }
}

const actor = { id: 'user-1', name: 'Ana Pérez' }

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de órdenes de taller', () => {
  it('lista órdenes con paginación, cliente, vehículo y resumen', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })
    repository.getStats.mockResolvedValue({
      total: 1,
      recepcionadas: 1,
      enDiagnostico: 0,
      pendientesAprobacion: 0,
      aprobadas: 0,
      rechazadas: 0,
    })

    const result = await workOrdersService.list({
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      status: 'all',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 'work-order-1',
          code: 'OT-000001',
          appointment: { id: appointmentId, code: 'CITA-000001' },
          customer: {
            id: customerId,
            documentNumber: '12345678',
            name: 'Ana Pérez',
          },
          vehicle: vehicleRef,
          status: 'RECEPCIONADA',
          technicianId: null,
          technician: null,
          subtotal: 0,
          total: 0,
          lineCount: 0,
          performedBy: 'user-1',
          diagnosisUpdatedBy: null,
          diagnosisUpdatedAt: null,
          budgetSentAt: null,
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          decisionNotes: null,
          createdAt: '2026-09-25T00:00:00.000Z',
          updatedAt: '2026-09-25T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      summary: {
        total: 1,
        recepcionadas: 1,
        enDiagnostico: 0,
        pendientesAprobacion: 0,
        aprobadas: 0,
        rechazadas: 0,
      },
    })
  })

  it('devuelve una orden por identificador', async () => {
    repository.findById.mockResolvedValue(record())
    const result = await workOrdersService.getById('work-order-1')
    expect(result.data.code).toBe('OT-000001')
    expect(result.data.diagnosis).toBeNull()
  })

  it('lanza 404 cuando la orden no existe', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(workOrdersService.getById('missing')).rejects.toThrowError(
      expect.objectContaining({
        status: 404,
        code: 'WORK_ORDER_NOT_FOUND',
      }),
    )
  })

  it('lanza 404 cuando la cita no existe al atender', async () => {
    repository.findAppointmentToAttend.mockResolvedValue(null)
    await expect(
      workOrdersService.createFromAppointment(appointmentId, actor, context),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 404,
        code: 'APPOINTMENT_NOT_FOUND',
      }),
    )
    expect(repository.createFromAppointment).not.toHaveBeenCalled()
  })

  it('crea una orden a partir de la cita atendida', async () => {
    repository.findAppointmentToAttend.mockResolvedValue({
      id: appointmentId,
      code: 'CITA-000001',
      status: 'PROGRAMADA',
      customerId,
      vehicleId,
      customer: customerRef,
      vehicle: vehicleRef,
    })
    repository.createFromAppointment.mockResolvedValue(record())

    const result = await workOrdersService.createFromAppointment(
      appointmentId,
      actor,
      context,
    )

    expect(repository.createFromAppointment).toHaveBeenCalledWith(
      appointmentId,
      actor,
      context,
    )
    expect(result.data.code).toBe('OT-000001')
  })

  it('actualiza el diagnóstico', async () => {
    repository.updateDiagnosis.mockResolvedValue(
      record({ status: 'EN_DIAGNOSTICO', diagnosis: 'Falla en frenos' }),
    )

    const result = await workOrdersService.updateDiagnosis(
      'work-order-1',
      'Falla en frenos',
      actor,
      context,
    )

    expect(repository.updateDiagnosis).toHaveBeenCalledWith(
      'work-order-1',
      'Falla en frenos',
      actor,
      context,
    )
    expect(result.data.status).toBe('EN_DIAGNOSTICO')
    expect(result.data.diagnosis).toBe('Falla en frenos')
  })

  it('rechaza guardar un presupuesto sin líneas', async () => {
    await expect(
      workOrdersService.saveBudget(
        'work-order-1',
        { lines: [] },
        actor,
        context,
      ),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'WORK_ORDER_NO_LINES',
      }),
    )
    expect(repository.saveBudget).not.toHaveBeenCalled()
  })

  it('guarda un presupuesto congelando precios activos', async () => {
    repository.findProductRef.mockResolvedValue(productRef)
    repository.findServiceRef.mockResolvedValue(serviceRef)
    repository.saveBudget.mockResolvedValue(
      record({
        status: 'PENDIENTE_APROBACION',
        subtotal: 200.5,
        total: 200.5,
        _count: { lines: 2 },
        lines: [
          {
            id: 'line-1',
            type: 'PRODUCT',
            productId,
            serviceId: null,
            name: 'Aceite 5W-30',
            code: 'P-001',
            unitLabel: 'btl',
            unitPrice: 120.5,
            quantity: 1,
            subtotal: 120.5,
          },
          {
            id: 'line-2',
            type: 'SERVICE',
            productId: null,
            serviceId,
            name: 'Cambio de aceite',
            code: 'S-001',
            unitLabel: null,
            unitPrice: 80,
            quantity: 1,
            subtotal: 80,
          },
        ],
      }),
    )

    const result = await workOrdersService.saveBudget(
      'work-order-1',
      {
        lines: [
          { type: 'PRODUCT', productId, quantity: 1 },
          { type: 'SERVICE', serviceId },
        ],
      },
      actor,
      context,
    )

    expect(repository.findProductRef).toHaveBeenCalledWith(productId)
    expect(repository.findServiceRef).toHaveBeenCalledWith(serviceId)
    expect(repository.saveBudget).toHaveBeenCalledWith(
      'work-order-1',
      expect.objectContaining({ subtotal: 200.5, total: 200.5 }),
      actor,
      context,
    )
    expect(result.data.subtotal).toBe(200.5)
    expect(result.data.lines).toHaveLength(2)
  })

  it('rechaza un presupuesto con un producto inactivo', async () => {
    repository.findProductRef.mockResolvedValue({
      ...productRef,
      active: false,
    })

    await expect(
      workOrdersService.saveBudget(
        'work-order-1',
        { lines: [{ type: 'PRODUCT', productId, quantity: 1 }] },
        actor,
        context,
      ),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'PRODUCT_INACTIVE',
      }),
    )
    expect(repository.saveBudget).not.toHaveBeenCalled()
  })

  it('envía el presupuesto', async () => {
    repository.sendBudget.mockResolvedValue(
      record({
        status: 'PENDIENTE_APROBACION',
        budgetSentAt: new Date('2026-09-26T00:00:00.000Z'),
      }),
    )

    const result = await workOrdersService.sendBudget(
      'work-order-1',
      actor,
      context,
    )

    expect(repository.sendBudget).toHaveBeenCalledWith(
      'work-order-1',
      actor,
      context,
    )
    expect(result.data.status).toBe('PENDIENTE_APROBACION')
  })

  it('decide aprobando la orden', async () => {
    repository.decide.mockResolvedValue(
      record({
        status: 'APROBADA',
        approvedBy: 'Ana Pérez',
        approvedAt: new Date('2026-09-26T00:00:00.000Z'),
      }),
    )

    const result = await workOrdersService.decide(
      'work-order-1',
      { decision: 'APPROVED' },
      actor,
      context,
    )

    expect(repository.decide).toHaveBeenCalledWith(
      'work-order-1',
      'APPROVED',
      null,
      actor,
      context,
    )
    expect(result.data.status).toBe('APROBADA')
    expect(result.data.approvedBy).toBe('Ana Pérez')
  })

  it('asigna un técnico activo', async () => {
    repository.findTechnicianRef.mockResolvedValue({
      id: technicianId,
      active: true,
      displayName: 'Luis Torres',
    })
    repository.updateTechnician.mockResolvedValue(
      record({
        technicianId,
        technician: { id: technicianId, displayName: 'Luis Torres' },
      }),
    )

    const result = await workOrdersService.updateTechnician(
      'work-order-1',
      { technicianId },
      actor,
      context,
    )

    expect(repository.updateTechnician).toHaveBeenCalledWith(
      'work-order-1',
      technicianId,
      actor,
      context,
    )
    expect(result.data.technician).toBe('Luis Torres')
  })

  it('rechaza un técnico inexistente o inactivo', async () => {
    repository.findTechnicianRef.mockResolvedValue(null)
    await expect(
      workOrdersService.updateTechnician(
        'work-order-1',
        { technicianId },
        actor,
        context,
      ),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 404,
        code: 'TECHNICIAN_NOT_FOUND',
      }),
    )

    repository.findTechnicianRef.mockResolvedValue({
      id: technicianId,
      active: false,
      displayName: 'Luis Torres',
    })
    await expect(
      workOrdersService.updateTechnician(
        'work-order-1',
        { technicianId },
        actor,
        context,
      ),
    ).rejects.toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'TECHNICIAN_INACTIVE',
      }),
    )
    expect(repository.updateTechnician).not.toHaveBeenCalled()
  })

  it('permite desasignar el técnico', async () => {
    repository.updateTechnician.mockResolvedValue(record())

    await workOrdersService.updateTechnician(
      'work-order-1',
      { technicianId: null },
      actor,
      context,
    )

    expect(repository.updateTechnician).toHaveBeenCalledWith(
      'work-order-1',
      null,
      actor,
      context,
    )
  })
})
