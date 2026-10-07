import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  listObligations: vi.fn(),
  findById: vi.fn(),
  registerPayment: vi.fn(),
  compensatePayment: vi.fn(),
}))

vi.mock('../src/modules/payments/payment.repository.js', () => ({
  paymentsRepository: repository,
}))

import { paymentsService } from '../src/modules/payments/payment.service.js'

const context = {
  requestId: 'req-pay-1',
  ipAddress: '127.0.0.1',
}

const customer = {
  id: 'a0000000-0000-4000-8000-000000000001',
  documentNumber: '12345678',
  firstName: 'Ana',
  lastName: 'Pérez',
  legalName: null,
}

function obligation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    code: 'VENTA-000001',
    status: 'CONFIRMED',
    total: 130,
    confirmedAt: new Date('2026-10-01T15:00:00.000Z'),
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    customer,
    payments: [],
    ...overrides,
  }
}

function detail(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    code: 'VENTA-000001',
    status: 'CONFIRMED',
    total: 130,
    confirmedAt: new Date('2026-10-01T15:00:00.000Z'),
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
    customer,
    events: [],
    ...overrides,
  }
}

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment-1',
    code: 'PAGO-000001',
    type: 'PAYMENT',
    amount: 50,
    method: 'CASH',
    notes: null,
    reason: null,
    performedBy: 'actor-1',
    occurredAt: new Date('2026-10-02T10:00:00.000Z'),
    createdAt: new Date('2026-10-02T10:00:00.000Z'),
    originalCode: null,
    ...overrides,
  }
}

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de cobros', () => {
  it('lista obligaciones con saldo, estado derivado y resumen', async () => {
    repository.listObligations.mockResolvedValue([
      obligation({
        payments: [
          {
            type: 'PAYMENT',
            amount: 50,
            method: 'CASH',
            occurredAt: new Date('2026-10-02T10:00:00.000Z'),
          },
        ],
      }),
      obligation({
        id: 'sale-2',
        code: 'VENTA-000002',
      }),
    ])

    const result = await paymentsService.list({
      search: '',
      status: 'all',
      method: 'all',
      from: null,
      to: null,
      page: 1,
      pageSize: 20,
    })

    expect(result.summary).toEqual({
      pendingCount: 2,
      pendingAmount: 210,
      collectedAmount: 50,
    })
    expect(result.data[0]).toMatchObject({
      id: 'sale-1',
      paid: 50,
      balance: 80,
      collectionStatus: 'PARTIALLY_PAID',
    })
    expect(result.data[1]).toMatchObject({
      id: 'sale-2',
      paid: 0,
      balance: 130,
      collectionStatus: 'PENDING',
    })
    expect(result.pagination.total).toBe(2)
  })

  it('filtra por estado de cobro derivado', async () => {
    repository.listObligations.mockResolvedValue([
      obligation({
        payments: [
          {
            type: 'PAYMENT',
            amount: 130,
            method: 'CASH',
            occurredAt: new Date('2026-10-02T10:00:00.000Z'),
          },
        ],
      }),
      obligation({ id: 'sale-2', code: 'VENTA-000002' }),
    ])

    const result = await paymentsService.list({
      search: '',
      status: 'PENDING',
      method: 'all',
      from: null,
      to: null,
      page: 1,
      pageSize: 20,
    })

    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('sale-2')
    expect(result.summary.pendingCount).toBe(1)
    expect(result.summary.pendingAmount).toBe(130)
  })

  it('filtra por método de pago y limita el resumen al período', async () => {
    repository.listObligations.mockResolvedValue([
      obligation({
        payments: [
          {
            type: 'PAYMENT',
            amount: 20,
            method: 'CASH',
            occurredAt: new Date('2026-10-02T10:00:00.000Z'),
          },
          {
            type: 'PAYMENT',
            amount: 30,
            method: 'CARD',
            occurredAt: new Date('2026-10-03T10:00:00.000Z'),
          },
        ],
      }),
    ])

    const result = await paymentsService.list({
      search: '',
      status: 'all',
      method: 'CARD',
      from: '2026-10-03',
      to: '2026-10-03',
      page: 1,
      pageSize: 20,
    })

    expect(result.data[0].id).toBe('sale-1')
    expect(result.summary.collectedAmount).toBe(30)
  })

  it('no cobra por período las obligaciones y exige rango válido', async () => {
    repository.listObligations.mockResolvedValue([])
    await expect(
      paymentsService.list({
        search: '',
        status: 'all',
        method: 'all',
        from: '2026-10-05',
        to: '2026-10-01',
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'PAYMENT_DATE_RANGE_INVALID',
    })
  })

  it('devuelve el detalle con historial neto y saldo recalculado', async () => {
    repository.findById.mockResolvedValue(
      detail({
        events: [
          event({ amount: 50 }),
          event({
            id: 'comp-1',
            code: 'COMP-000001',
            type: 'COMPENSATION',
            amount: 20,
            method: 'CASH',
            originalCode: 'PAGO-000001',
          }),
        ],
      }),
    )

    const result = await paymentsService.getById('sale-1')

    expect(result.data).toMatchObject({
      paid: 30,
      balance: 100,
      collectionStatus: 'PARTIALLY_PAID',
    })
    expect(result.data.events).toMatchObject([
      { code: 'PAGO-000001', netAmount: 50 },
      { code: 'COMP-000001', netAmount: -20, originalCode: 'PAGO-000001' },
    ])
  })

  it('informa una venta inexistente en el detalle', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(paymentsService.getById('sale-1')).rejects.toMatchObject({
      status: 404,
      code: 'SALE_NOT_FOUND',
    })
  })

  it('registra un pago y devuelve el detalle actualizado', async () => {
    repository.registerPayment.mockResolvedValue(
      detail({
        total: 130,
        events: [event({ amount: 50 })],
      }),
    )

    const result = await paymentsService.registerPayment(
      'sale-1',
      { requestId: 'uuid', amount: 50, method: 'CASH' },
      { id: 'user-1', name: 'Cajero' },
      context,
    )

    expect(repository.registerPayment).toHaveBeenCalledWith(
      'sale-1',
      { requestId: 'uuid', amount: 50, method: 'CASH' },
      { id: 'user-1', name: 'Cajero' },
      context,
    )
    expect(result.data.paid).toBe(50)
    expect(result.data.balance).toBe(80)
  })

  it('compensa un pago con el motivo y devuelve el detalle', async () => {
    repository.compensatePayment.mockResolvedValue(
      detail({
        total: 130,
        events: [
          event({ amount: 50 }),
          event({
            id: 'comp-1',
            code: 'COMP-000001',
            type: 'COMPENSATION',
            amount: 20,
            reason: 'Cobro duplicado',
            originalCode: 'PAGO-000001',
          }),
        ],
      }),
    )

    const result = await paymentsService.compensatePayment(
      'payment-1',
      { requestId: 'uuid', amount: 20, reason: 'Cobro duplicado' },
      { id: 'user-1', name: 'Cajero' },
      context,
    )

    expect(repository.compensatePayment).toHaveBeenCalledWith(
      'payment-1',
      { requestId: 'uuid', amount: 20, reason: 'Cobro duplicado' },
      { id: 'user-1', name: 'Cajero' },
      context,
    )
    expect(result.data.events[1].netAmount).toBe(-20)
    expect(result.data.balance).toBe(100)
  })

  it('paginá in-memory sobre la lista filtrada', async () => {
    repository.listObligations.mockResolvedValue(
      Array.from({ length: 25 }, (_, index) =>
        obligation({
          id: `sale-${index + 1}`,
          code: `VENTA-${String(index + 1).padStart(6, '0')}`,
        }),
      ),
    )

    const result = await paymentsService.list({
      search: '',
      status: 'all',
      method: 'all',
      from: null,
      to: null,
      page: 2,
      pageSize: 10,
    })

    expect(result.data).toHaveLength(10)
    expect(result.data[0].id).toBe('sale-11')
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    })
  })
})
