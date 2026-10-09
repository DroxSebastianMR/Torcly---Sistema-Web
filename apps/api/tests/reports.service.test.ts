import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  listSalesInPeriod: vi.fn(),
  listSaleLinesInPeriod: vi.fn(),
  listPaymentsInPeriod: vi.fn(),
  listMovementsInPeriod: vi.fn(),
  listServiceLinesInPeriod: vi.fn(),
  listWorkOrdersInPeriod: vi.fn(),
  listDeliveredWorkOrdersInPeriod: vi.fn(),
  countAppointmentsInPeriod: vi.fn(),
  listPendingObligations: vi.fn(),
  listLowStockProducts: vi.fn(),
}))

vi.mock('../src/modules/reports/reports.repository.js', () => ({
  reportsRepository: repository,
}))

import { reportsService } from '../src/modules/reports/reports.service.js'
import type {
  ReportBlock,
  ReportBlockData,
} from '../src/modules/reports/reports.types.js'

type ReportFilters = { from: string | null; to: string | null }

async function getBlock<B extends ReportBlock>(
  block: B,
  filters: ReportFilters,
  permissions: readonly string[],
): Promise<Extract<ReportBlockData, { block: B }>> {
  return (await reportsService.getBlock(
    block,
    filters,
    permissions,
  )) as Extract<ReportBlockData, { block: B }>
}

const salesOnly = ['sales:read']
const allPermissions = [
  'sales:read',
  'cash:read',
  'inventory:read',
  'services:read',
  'workshop:read',
  'appointments:read',
]

function obligation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    code: 'VENTA-000001',
    total: 130,
    confirmedAt: new Date('2026-10-01T15:00:00.000Z'),
    customer: null,
    payments: [],
    ...overrides,
  }
}

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de reportes', () => {
  it('resume solo los bloques autorizados y no consulta datos', async () => {
    const result = await reportsService.getSummary(
      { from: '2026-10-01', to: '2026-10-31' },
      salesOnly,
    )

    expect(result.period).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(Object.keys(result.blocks)).toEqual(['sales'])
    expect(result.blocks.sales?.source).toBe('sales')
    expect(result.blocks.payments).toBeUndefined()
    expect(result.generatedAt).toBeTruthy()
    for (const mock of Object.values(repository)) {
      expect(mock).not.toHaveBeenCalled()
    }
  })

  it('rechaza un bloque sin sus permisos sin consultar datos', async () => {
    const error = await reportsService
      .getBlock('payments', { from: null, to: null }, salesOnly)
      .catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      status: 403,
      code: 'REPORTS_BLOCK_FORBIDDEN',
    })
    expect(repository.listPaymentsInPeriod).not.toHaveBeenCalled()
    expect(repository.listPendingObligations).not.toHaveBeenCalled()
  })

  it('calcula ventas confirmadas, ticket promedio y composición', async () => {
    repository.listSalesInPeriod.mockResolvedValue([
      { total: 100, confirmedAt: new Date('2026-10-01T15:00:00.000Z') },
      { total: 80, confirmedAt: new Date('2026-10-02T15:00:00.000Z') },
    ])
    repository.listSaleLinesInPeriod.mockResolvedValue([
      {
        type: 'PRODUCT',
        code: 'P-001',
        name: 'Pastilla',
        quantity: 2,
        amount: 140,
      },
      {
        type: 'SERVICE',
        code: 'S-001',
        name: 'Cambio de aceite',
        quantity: 1,
        amount: 40,
      },
    ])

    const result = await getBlock(
      'sales',
      { from: '2026-10-01', to: '2026-10-02' },
      allPermissions,
    )

    expect(result.block).toBe('sales')
    expect(result.period).toEqual({ from: '2026-10-01', to: '2026-10-02' })
    expect(result.metrics).toEqual({
      count: 2,
      amount: 180,
      averageTicket: 90,
    })
    expect(result.trend).toEqual([
      { bucket: '2026-10-01', label: '1 oct', count: 1, amount: 100 },
      { bucket: '2026-10-02', label: '2 oct', count: 1, amount: 80 },
    ])
    expect(result.composition).toHaveLength(2)
    expect(repository.listSaleLinesInPeriod).toHaveBeenCalledWith(
      '2026-10-01',
      '2026-10-02',
    )
  })

  it('deriva cobrado y saldo pendiente con las reglas de payments', async () => {
    repository.listPaymentsInPeriod.mockResolvedValue([
      {
        type: 'PAYMENT',
        amount: 50,
        occurredAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        type: 'PAYMENT',
        amount: 60,
        occurredAt: new Date('2026-10-02T10:00:00.000Z'),
      },
      {
        type: 'COMPENSATION',
        amount: 10,
        occurredAt: new Date('2026-10-02T12:00:00.000Z'),
      },
    ])
    repository.listPendingObligations.mockResolvedValue([
      obligation({
        total: 130,
        payments: [
          { type: 'PAYMENT', amount: 50 },
          { type: 'COMPENSATION', amount: 10 },
        ],
      }),
      obligation({
        id: 'sale-2',
        code: 'VENTA-000002',
        total: 40,
        payments: [],
      }),
      obligation({
        id: 'sale-3',
        code: 'VENTA-000003',
        total: 60,
        payments: [{ type: 'PAYMENT', amount: 60 }],
      }),
    ])

    const result = await getBlock(
      'payments',
      { from: '2026-10-01', to: '2026-10-02' },
      allPermissions,
    )

    expect(result.metrics).toMatchObject({
      grossCollected: 110,
      compensated: 10,
      netCollected: 100,
      paymentCount: 2,
      pendingCount: 2,
      pendingAmount: 130,
      byStatus: {
        PENDING: { count: 1, amount: 40 },
        PARTIALLY_PAID: { count: 1, amount: 90 },
        PAID: { count: 1, amount: 0 },
      },
    })
    expect(result.trend).toEqual([
      { bucket: '2026-10-01', label: '1 oct', count: 1, amount: 50 },
      { bucket: '2026-10-02', label: '2 oct', count: 2, amount: 50 },
    ])
  })

  it('reutiliza la regla de stock con movimientos confirmados', async () => {
    repository.listMovementsInPeriod.mockResolvedValue([
      {
        type: 'INITIAL',
        quantity: 10,
        occurredAt: new Date('2026-10-01T10:00:00.000Z'),
      },
      {
        type: 'ENTRY',
        quantity: 5,
        occurredAt: new Date('2026-10-01T11:00:00.000Z'),
      },
      {
        type: 'EXIT',
        quantity: 3,
        occurredAt: new Date('2026-10-02T10:00:00.000Z'),
      },
    ])
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

    const result = await getBlock(
      'inventory',
      { from: '2026-10-01', to: '2026-10-02' },
      allPermissions,
    )

    expect(result.metrics).toMatchObject({
      movementCount: 3,
      netQuantity: 12,
      byType: {
        INITIAL: 1,
        ENTRY: 1,
        EXIT: 1,
        ADJUSTMENT_IN: 0,
        ADJUSTMENT_OUT: 0,
      },
      lowStockCount: 1,
    })
    expect(result.trend).toEqual([
      { bucket: '2026-10-01', label: '1 oct', count: 2, amount: 15 },
      { bucket: '2026-10-02', label: '2 oct', count: 1, amount: -3 },
    ])
    expect(result.lowStock).toEqual([
      {
        code: 'P-001',
        name: 'Pastilla',
        stock: 1,
        minimumStock: 5,
        unitLabel: 'und',
      },
    ])
  })

  it('agrega líneas de servicio con unidades, importe y tendencia', async () => {
    repository.listServiceLinesInPeriod.mockResolvedValue([
      {
        code: 'S-001',
        name: 'Cambio de aceite',
        quantity: 1,
        amount: 80,
        saleConfirmedAt: new Date('2026-10-01T15:00:00.000Z'),
      },
      {
        code: 'S-001',
        name: 'Cambio de aceite',
        quantity: 1,
        amount: 90,
        saleConfirmedAt: new Date('2026-10-02T15:00:00.000Z'),
      },
      {
        code: 'S-002',
        name: 'Balanceo',
        quantity: 4,
        amount: 120,
        saleConfirmedAt: new Date('2026-10-01T16:00:00.000Z'),
      },
    ])

    const result = await getBlock(
      'services',
      { from: '2026-10-01', to: '2026-10-02' },
      allPermissions,
    )

    expect(result.metrics).toEqual({
      serviceCount: 2,
      unitsSold: 6,
      amount: 290,
      averagePerUnit: 48.33,
    })
    expect(result.top).toEqual([
      { code: 'S-001', name: 'Cambio de aceite', quantity: 2, amount: 170 },
      { code: 'S-002', name: 'Balanceo', quantity: 4, amount: 120 },
    ])
    expect(result.trend).toEqual([
      { bucket: '2026-10-01', label: '1 oct', count: 5, amount: 200 },
      { bucket: '2026-10-02', label: '2 oct', count: 1, amount: 90 },
    ])
  })

  it('agrupa órdenes y citas por estado y calcula entregas', async () => {
    repository.listWorkOrdersInPeriod.mockResolvedValue([
      {
        status: 'RECEPCIONADA',
        createdAt: new Date('2026-10-01T08:00:00.000Z'),
        deliveredAt: null,
      },
      {
        status: 'ENTREGADA',
        createdAt: new Date('2026-10-01T09:00:00.000Z'),
        deliveredAt: new Date('2026-10-03T09:00:00.000Z'),
      },
      {
        status: 'ENTREGADA',
        createdAt: new Date('2026-10-02T09:00:00.000Z'),
        deliveredAt: new Date('2026-10-02T10:00:00.000Z'),
      },
    ])
    repository.listDeliveredWorkOrdersInPeriod.mockResolvedValue([
      {
        status: 'ENTREGADA',
        createdAt: new Date('2026-10-01T09:00:00.000Z'),
        deliveredAt: new Date('2026-10-03T09:00:00.000Z'),
      },
      {
        status: 'ENTREGADA',
        createdAt: new Date('2026-10-02T09:00:00.000Z'),
        deliveredAt: new Date('2026-10-02T10:00:00.000Z'),
      },
    ])
    repository.countAppointmentsInPeriod.mockResolvedValue({
      PROGRAMADA: 4,
      CANCELADA: 1,
      ATENDIDA: 7,
    })

    const result = await getBlock(
      'workshop',
      { from: '2026-10-01', to: '2026-10-03' },
      allPermissions,
    )

    expect(result.metrics.workOrderCount).toBe(3)
    expect(result.metrics.workOrdersByStatus).toMatchObject({
      RECEPCIONADA: 1,
      ENTREGADA: 2,
      RECHAZADA: 0,
    })
    expect(result.metrics.deliveredCount).toBe(2)
    expect(result.metrics.averageDeliveryHours).toBe(24.5)
    expect(result.metrics.appointmentCount).toBe(12)
    expect(result.metrics.appointmentsByStatus).toEqual({
      PROGRAMADA: 4,
      CANCELADA: 1,
      ATENDIDA: 7,
    })
    expect(result.trend).toEqual([
      { bucket: '2026-10-01', label: '1 oct', count: 2, amount: 0 },
      { bucket: '2026-10-02', label: '2 oct', count: 1, amount: 1 },
      { bucket: '2026-10-03', label: '3 oct', count: 0, amount: 1 },
    ])
  })

  it('deja entregas y tiempo promedio nulos cuando no hay información', async () => {
    repository.listWorkOrdersInPeriod.mockResolvedValue([
      {
        status: 'EN_DIAGNOSTICO',
        createdAt: new Date('2026-10-01T08:00:00.000Z'),
        deliveredAt: null,
      },
    ])
    repository.listDeliveredWorkOrdersInPeriod.mockResolvedValue([])
    repository.countAppointmentsInPeriod.mockResolvedValue({
      PROGRAMADA: 0,
      CANCELADA: 0,
      ATENDIDA: 0,
    })

    const result = await getBlock(
      'workshop',
      { from: '2026-10-01', to: '2026-10-31' },
      allPermissions,
    )

    expect(result.metrics.deliveredCount).toBe(0)
    expect(result.metrics.averageDeliveryHours).toBeNull()
    expect(result.metrics.appointmentCount).toBe(0)
  })

  it('rechaza un período invertido y resuelve el predefinido', async () => {
    const error = await reportsService
      .getBlock(
        'sales',
        { from: '2026-10-05', to: '2026-10-01' },
        allPermissions,
      )
      .catch((caught: unknown) => caught)
    expect(error).toMatchObject({
      status: 400,
      code: 'REPORTS_DATE_RANGE_INVALID',
    })

    repository.listSalesInPeriod.mockResolvedValue([])
    repository.listSaleLinesInPeriod.mockResolvedValue([])
    const result = await getBlock(
      'sales',
      { from: null, to: '2026-10-31' },
      allPermissions,
    )
    expect(result.period).toEqual({ from: '2026-10-01', to: '2026-10-31' })
  })
})
