import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  countAppointmentsByStatus: vi.fn(),
  listAppointmentAttention: vi.fn(),
  countWorkOrdersByStatus: vi.fn(),
  listWorkOrderAttention: vi.fn(),
  summarizeSales: vi.fn(),
  listSaleAttention: vi.fn(),
  listPendingObligations: vi.fn(),
  listLowStockProducts: vi.fn(),
}))

vi.mock('../src/modules/operations/operations.repository.js', () => ({
  operationsRepository: repository,
}))

import { operationsService } from '../src/modules/operations/operations.service.js'
import { OPERATIONAL_SECTIONS } from '../src/modules/operations/operations.types.js'

const filters = { from: null, to: null, page: 1, pageSize: 10 }

function obligation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    code: 'VENTA-000001',
    total: 130,
    confirmedAt: new Date('2026-10-01T15:00:00.000Z'),
    customer: {
      firstName: 'Ana',
      lastName: 'Pérez',
      legalName: null,
    },
    payments: [],
    ...overrides,
  }
}

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de consulta operativa', () => {
  it('incluye solo las secciones autorizadas en el resumen', async () => {
    repository.summarizeSales.mockResolvedValue({
      confirmedCount: 3,
      confirmedAmount: 450,
    })

    const result = await operationsService.getSummary(
      { from: '2026-10-01', to: '2026-10-31' },
      ['sales:read'],
    )

    expect(Object.keys(result.sections)).toEqual(['sales'])
    expect(result.sections.sales).toEqual({
      section: 'sales',
      confirmedCount: 3,
      confirmedAmount: 450,
    })
    expect(repository.summarizeSales).toHaveBeenCalledWith(
      '2026-10-01',
      '2026-10-31',
    )
    expect(repository.countAppointmentsByStatus).not.toHaveBeenCalled()
    expect(repository.listLowStockProducts).not.toHaveBeenCalled()
    expect(result.period).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(Object.keys(result.descriptors).sort()).toEqual(
      [...OPERATIONAL_SECTIONS].sort(),
    )
    expect(result.generatedAt).toBeTruthy()
  })

  it('agrupa citas y órdenes por estado con atención trazable', async () => {
    repository.countAppointmentsByStatus.mockResolvedValue({
      PROGRAMADA: 4,
      CANCELADA: 1,
      ATENDIDA: 7,
    })
    repository.countWorkOrdersByStatus.mockResolvedValue({
      RECEPCIONADA: 2,
      EN_DIAGNOSTICO: 1,
      PENDIENTE_APROBACION: 0,
      APROBADA: 3,
      RECHAZADA: 1,
      EN_EJECUCION: 5,
      LISTA_PARA_ENTREGA: 2,
      ENTREGADA: 6,
    })

    const result = await operationsService.getSummary(
      { from: null, to: null },
      ['appointments:read', 'workshop:read'],
    )

    expect(result.sections.appointments).toEqual({
      section: 'appointments',
      byStatus: { PROGRAMADA: 4, CANCELADA: 1, ATENDIDA: 7 },
      total: 12,
      attentionCount: 4,
    })
    expect(result.sections.workOrders).toMatchObject({
      total: 20,
      attentionCount: 13,
      byStatus: { ENTREGADA: 6, RECHAZADA: 1, RECEPCIONADA: 2 },
    })
    expect(repository.countWorkOrdersByStatus).toHaveBeenCalledWith(null, null)
  })

  it('deriva el saldo pendiente en servidor con las reglas de payments', async () => {
    repository.summarizeSales.mockResolvedValue({
      confirmedCount: 0,
      confirmedAmount: 0,
    })
    repository.listPendingObligations.mockResolvedValue([
      obligation({
        payments: [
          { type: 'PAYMENT', amount: 50 },
          { type: 'COMPENSATION', amount: 10 },
        ],
      }),
      obligation({
        id: 'sale-2',
        code: 'VENTA-000002',
        total: 80,
        payments: [{ type: 'PAYMENT', amount: 80 }],
      }),
    ])

    const result = await operationsService.getSummary(
      { from: null, to: null },
      ['cash:read', 'sales:read'],
    )

    expect(result.sections.payments).toEqual({
      section: 'payments',
      pendingCount: 1,
      pendingAmount: 90,
    })
  })

  it('cuenta productos con alerta de stock bajo', async () => {
    repository.listLowStockProducts.mockResolvedValue([
      {
        id: 'product-1',
        code: 'P-001',
        name: 'Pastilla',
        stock: 1,
        minimumStock: 5,
        unitLabel: 'und',
      },
    ])

    const result = await operationsService.getSummary(
      { from: null, to: null },
      ['inventory:read'],
    )

    expect(result.sections.inventory).toEqual({
      section: 'inventory',
      lowStockCount: 1,
    })
  })

  it('rechaza una lista de atención sin permiso de la sección', async () => {
    const error = await operationsService
      .getAttention('payments', filters, ['sales:read'])
      .catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      status: 403,
      code: 'OPERATIONS_SECTION_FORBIDDEN',
    })
    expect(repository.listPendingObligations).not.toHaveBeenCalled()
  })

  it('pagina y filtra la atención de saldos pendientes', async () => {
    repository.listPendingObligations.mockResolvedValue([
      obligation({
        payments: [{ type: 'PAYMENT', amount: 130 }],
      }),
      obligation({
        id: 'sale-2',
        code: 'VENTA-000002',
        total: 40,
        customer: null,
        payments: [{ type: 'PAYMENT', amount: 10 }],
      }),
      obligation({
        id: 'sale-3',
        code: 'VENTA-000003',
        total: 60,
        payments: [],
      }),
    ])

    const result = await operationsService.getAttention(
      'payments',
      { ...filters, page: 2, pageSize: 1 },
      ['cash:read', 'sales:read'],
    )

    expect(result.section).toBe('payments')
    expect(result.descriptor.periodField).toBe('snapshot')
    expect(result.data).toMatchObject([
      { code: 'VENTA-000003', balance: 60, collectionStatus: 'PENDING' },
    ])
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    })
    expect(result.data[0]).not.toHaveProperty('id')
  })

  it('lista las citas programadas con fecha y hora normalizadas', async () => {
    repository.listAppointmentAttention.mockResolvedValue({
      items: [
        {
          id: 'appointment-1',
          code: 'CITA-000001',
          date: new Date('2026-10-05T00:00:00.000Z'),
          time: new Date('2000-01-01T09:30:00.000Z'),
          status: 'PROGRAMADA',
          customer: {
            firstName: 'Ana',
            lastName: 'Pérez',
            legalName: null,
          },
          vehicle: { plate: 'ABC-123' },
        },
      ],
      total: 1,
    })

    const result = await operationsService.getAttention(
      'appointments',
      filters,
      ['appointments:read'],
    )

    expect(repository.listAppointmentAttention).toHaveBeenCalledWith(
      null,
      null,
      0,
      10,
    )
    expect(result.data).toEqual([
      {
        code: 'CITA-000001',
        date: '2026-10-05',
        time: '09:30',
        status: 'PROGRAMADA',
        customerName: 'Ana Pérez',
        vehiclePlate: 'ABC-123',
      },
    ])
    expect(result.pagination.total).toBe(1)
  })

  it('rechaza un período invertido en el resumen y en las listas', async () => {
    const summaryError = await operationsService
      .getSummary({ from: '2026-10-05', to: '2026-10-01' }, ['sales:read'])
      .catch((caught: unknown) => caught)
    expect(summaryError).toMatchObject({
      status: 400,
      code: 'OPERATIONS_DATE_RANGE_INVALID',
    })

    const attentionError = await operationsService
      .getAttention(
        'inventory',
        { ...filters, from: '2026-10-05', to: '2026-10-01' },
        ['inventory:read'],
      )
      .catch((caught: unknown) => caught)
    expect(attentionError).toMatchObject({
      status: 400,
      code: 'OPERATIONS_DATE_RANGE_INVALID',
    })
    expect(repository.listLowStockProducts).not.toHaveBeenCalled()
  })
})
