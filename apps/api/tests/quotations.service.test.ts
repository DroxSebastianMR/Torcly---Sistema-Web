import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  convertToOrder: vi.fn(),
}))

vi.mock('../src/modules/quotations/quotations.repository.js', () => ({
  quotationsRepository: repository,
}))

import { quotationsService } from '../src/modules/quotations/quotations.service.js'

const context = {
  requestId: 'req-quote-1',
  ipAddress: '127.0.0.1',
}

const customerId = 'c0000000-0000-4000-8000-000000000001'
const vehicleId = 'v0000000-0000-4000-8000-000000000002'
const organizationId = 'o0000000-0000-4000-8000-000000000003'

function mockQuotation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quote-1',
    code: 'COT-000001',
    organizationId,
    customerId,
    vehicleId,
    vehiclePlate: 'ABC-123',
    status: 'DRAFT',
    subtotal: 150,
    total: 150,
    validUntil: new Date('2026-02-01T00:00:00.000Z'),
    notes: 'Presupuesto de afinamiento',
    workOrderId: null,
    createdBy: 'Juan Asesor',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    customer: {
      id: customerId,
      documentNumber: '12345678',
      firstName: 'Carlos',
      lastName: 'Gómez',
      legalName: null,
      phone: '987654321',
      email: 'carlos@example.com',
    },
    vehicle: {
      id: vehicleId,
      plate: 'ABC-123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
    },
    items: [
      {
        id: 'item-1',
        type: 'PRODUCT',
        productId: 'p-1',
        serviceId: null,
        name: 'Aceite sintético',
        code: 'ACEITE-5W30',
        unitLabel: 'gal',
        unitPrice: 100,
        quantity: 1,
        subtotal: 100,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'item-2',
        type: 'SERVICE',
        productId: null,
        serviceId: 's-1',
        name: 'Cambio de aceite',
        code: 'SRV-ACEITE',
        unitLabel: null,
        unitPrice: 50,
        quantity: 1,
        subtotal: 50,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de Cotizaciones', () => {
  it('lista cotizaciones con paginación y formato de cliente/vehículo', async () => {
    repository.list.mockResolvedValue({
      total: 1,
      items: [mockQuotation()],
    })

    const result = await quotationsService.list(
      { status: 'all', page: 1, pageSize: 10 },
      organizationId,
    )

    expect(result.data).toHaveLength(1)
    expect(result.data[0].code).toBe('COT-000001')
    expect(result.data[0].customer?.name).toBe('Carlos Gómez')
    expect(result.data[0].vehicle?.plate).toBe('ABC-123')
    expect(result.data[0].total).toBe(150)
  })

  it('obtiene una cotización por id con sus líneas detalladas', async () => {
    repository.findById.mockResolvedValue(mockQuotation())

    const result = await quotationsService.getById('quote-1', organizationId)

    expect(result.data.code).toBe('COT-000001')
    expect(result.data.items).toHaveLength(2)
    expect(result.data.items[0].name).toBe('Aceite sintético')
    expect(result.data.items[1].name).toBe('Cambio de aceite')
  })

  it('crea una cotización y retorna su detalle', async () => {
    const quote = mockQuotation()
    repository.create.mockResolvedValue(quote)

    const result = await quotationsService.create(
      {
        customerId,
        vehicleId,
        items: [
          {
            type: 'PRODUCT',
            name: 'Aceite sintético',
            code: 'ACEITE-5W30',
            unitPrice: 100,
            quantity: 1,
          },
        ],
      },
      { id: 'u-1', name: 'Juan Asesor' },
      context,
      organizationId,
    )

    expect(result.data.code).toBe('COT-000001')
    expect(result.data.total).toBe(150)
  })

  it('rechaza crear una cotización sin ítems', async () => {
    await expect(
      quotationsService.create(
        { customerId, items: [] },
        { id: 'u-1', name: 'Juan Asesor' },
        context,
        organizationId,
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'QUOTATION_EMPTY_ITEMS',
    })
  })

  it('convierte una cotización en Orden de Taller con éxito', async () => {
    const approvedQuote = mockQuotation({
      status: 'APPROVED',
      workOrderId: 'order-99',
    })
    repository.convertToOrder.mockResolvedValue({
      quotation: approvedQuote,
      workOrder: { id: 'order-99', code: 'OT-000005' },
    })

    const conversionInput = {
      mode: 'EXISTING' as const,
      customerId: 'customer-1',
      vehicleId: 'vehicle-1',
    }
    const result = await quotationsService.convertToOrder(
      'quote-1',
      conversionInput,
      { id: 'u-1', name: 'Juan Asesor' },
      context,
      organizationId,
    )

    expect(repository.convertToOrder).toHaveBeenCalledWith(
      'quote-1',
      conversionInput,
      { id: 'u-1', name: 'Juan Asesor' },
      context,
      organizationId,
    )
    expect(result.data.quotation.status).toBe('APPROVED')
    expect(result.data.workOrder.code).toBe('OT-000005')
  })
})
