import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  findCustomerRef: vi.fn(),
  findProductRef: vi.fn(),
  findServiceRef: vi.fn(),
  findUserDisplayNames: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  confirm: vi.fn(),
  getCatalog: vi.fn(),
}))

vi.mock('../src/modules/sales/sales.repository.js', () => ({
  salesRepository: repository,
}))

import { salesService } from '../src/modules/sales/sales.service.js'

const context = {
  requestId: 'req-sale-1',
  ipAddress: '127.0.0.1',
}

const productId = 'a0000000-0000-4000-8000-000000000001'
const serviceId = 'a0000000-0000-4000-8000-000000000002'
const customerId = 'a0000000-0000-4000-8000-000000000003'

function line(overrides: Record<string, unknown> = {}) {
  return {
    id: 'line-1',
    type: 'PRODUCT',
    productId,
    serviceId: null,
    name: 'Filtro de aceite',
    code: 'FILTRO-01',
    unitLabel: 'ud',
    unitPrice: 35.5,
    quantity: 2,
    subtotal: 71,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    code: 'VENTA-000001',
    customerId: null,
    status: 'DRAFT',
    subtotal: 71,
    total: 71,
    performedBy: 'actor-1',
    confirmedBy: null,
    confirmedAt: null,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    customer: null,
    lines: [line()],
    ...overrides,
  }
}

const input = {
  customerId: null,
  lines: [{ type: 'PRODUCT', productId, quantity: 2 } as const],
}

beforeEach(() => {
  for (const mock of Object.values(repository)) mock.mockReset()
})

describe('Servicio de ventas', () => {
  it('lista ventas con paginación y resumen de cliente', async () => {
    repository.list.mockResolvedValue({
      items: [
        record({
          status: 'CONFIRMED',
          confirmedBy: 'actor-1',
          confirmedAt: new Date('2026-01-03T00:00:00.000Z'),
          _count: { lines: 1 },
          customer: {
            id: customerId,
            documentNumber: '12345678',
            firstName: 'Ana',
            lastName: 'Pérez',
            legalName: null,
          },
        }),
      ],
      total: 1,
    })

    const result = await salesService.list({
      search: 'ana',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      search: 'ana',
      status: 'all',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 'sale-1',
          code: 'VENTA-000001',
          customer: {
            id: customerId,
            documentNumber: '12345678',
            name: 'Ana Pérez',
          },
          status: 'CONFIRMED',
          subtotal: 71,
          total: 71,
          lineCount: 1,
          performedBy: 'actor-1',
          confirmedBy: 'actor-1',
          confirmedAt: '2026-01-03T00:00:00.000Z',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })
  })

  it('informa una venta inexistente en el detalle', async () => {
    repository.findById.mockResolvedValue(null)
    await expect(salesService.getById('sale-1')).rejects.toMatchObject({
      status: 404,
      code: 'SALE_NOT_FOUND',
    })
  })

  it('consume el detalle y expone el catálogo de venta', async () => {
    repository.findById.mockResolvedValue(record())
    const detail = await salesService.getById('sale-1')
    expect(detail.data.code).toBe('VENTA-000001')
    expect(detail.data.lines[0]).toMatchObject({
      unitPrice: 35.5,
      quantity: 2,
      subtotal: 71,
    })

    repository.getCatalog.mockResolvedValue({
      products: [
        {
          productId,
          code: 'FILTRO-01',
          name: 'Filtro de aceite',
          unit: { name: 'Unidad', symbol: 'ud' },
          active: true,
          salePrice: 35.5,
          stock: 10,
          lowStock: false,
        },
      ],
      services: [
        { id: serviceId, code: 'SVC-1', name: 'Cambio de aceite', price: 20 },
      ],
    })
    const catalog = await salesService.getCatalog()
    expect(catalog.data.products[0].stock).toBe(10)
    expect(catalog.data.services[0].price).toBe(20)
  })

  it('resuelve el nombre de usuario para ventas antiguas que guardaron UUID', async () => {
    const userId = 'ad311bf4-c52d-4a45-a8ee-cbcbcc5c4d4b'
    repository.findById.mockResolvedValue(
      record({ performedBy: userId, confirmedBy: userId }),
    )
    repository.findUserDisplayNames.mockResolvedValue([
      { id: userId, displayName: 'Arian Bautista' },
    ])

    const result = await salesService.getById('sale-1')

    expect(result.data.performedBy).toBe('Arian Bautista')
    expect(result.data.confirmedBy).toBe('Arian Bautista')
  })

  it('crea una venta en borrador con captura de precios y totales', async () => {
    repository.findProductRef.mockResolvedValue({
      id: productId,
      code: 'FILTRO-01',
      name: 'Filtro de aceite',
      active: true,
      salePrice: 35.5,
      unit: { name: 'Unidad', symbol: 'ud' },
    })
    repository.create.mockResolvedValue(record())

    const result = await salesService.create(input, 'actor-1', context)

    expect(repository.create).toHaveBeenCalledWith(
      {
        customerId: null,
        subtotal: 71,
        total: 71,
        lines: [
          expect.objectContaining({
            type: 'PRODUCT',
            productId,
            name: 'Filtro de aceite',
            unitPrice: 35.5,
            quantity: 2,
            subtotal: 71,
          }),
        ],
      },
      { id: 'actor-1', name: 'actor-1' },
      context,
    )
    expect(result.data.status).toBe('DRAFT')
  })

  it('combina productos y servicios al calcular totales', async () => {
    repository.findProductRef.mockResolvedValue({
      id: productId,
      code: 'FILTRO-01',
      name: 'Filtro de aceite',
      active: true,
      salePrice: 35.5,
      unit: { name: 'Unidad', symbol: 'ud' },
    })
    repository.findServiceRef.mockResolvedValue({
      id: serviceId,
      code: 'SVC-1',
      name: 'Cambio de aceite',
      active: true,
      price: 20,
    })
    repository.create.mockResolvedValue(record())

    await salesService.create(
      {
        customerId: null,
        lines: [
          { type: 'PRODUCT', productId, quantity: 2 },
          { type: 'SERVICE', serviceId },
        ],
      },
      'actor-1',
      context,
    )

    const [inputPayload] = repository.create.mock.calls[0]
    expect(inputPayload).toMatchObject({ subtotal: 91, total: 91 })
  })

  it('rechaza productos y servicios inexistentes o inactivos', async () => {
    repository.findProductRef.mockResolvedValue(null)
    await expect(
      salesService.create(input, 'actor-1', context),
    ).rejects.toMatchObject({ status: 404, code: 'PRODUCT_NOT_FOUND' })

    repository.findProductRef.mockResolvedValue({
      id: productId,
      code: 'FILTRO-01',
      name: 'Filtro de aceite',
      active: false,
      salePrice: 35.5,
      unit: { name: 'Unidad', symbol: 'ud' },
    })
    await expect(
      salesService.create(input, 'actor-1', context),
    ).rejects.toMatchObject({ status: 409, code: 'PRODUCT_INACTIVE' })

    repository.findServiceRef.mockResolvedValue(null)
    await expect(
      salesService.create(
        {
          customerId: null,
          lines: [{ type: 'SERVICE', serviceId }],
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({ status: 404, code: 'SERVICE_NOT_FOUND' })
  })

  it('valida la existencia del cliente al crear', async () => {
    repository.findCustomerRef.mockResolvedValue(null)
    await expect(
      salesService.create(
        {
          customerId,
          lines: input.lines,
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({ status: 404, code: 'CUSTOMER_NOT_FOUND' })
  })

  it('rechaza una venta sin líneas', async () => {
    await expect(
      salesService.create({ customerId: null, lines: [] }, 'actor-1', context),
    ).rejects.toMatchObject({ status: 400, code: 'SALE_NO_LINES' })
  })

  it('actualiza un borrador recalculando líneas y cliente', async () => {
    repository.findServiceRef.mockResolvedValue({
      id: serviceId,
      code: 'SVC-1',
      name: 'Cambio de aceite',
      active: true,
      price: 20,
    })
    repository.update.mockResolvedValue(
      record({
        status: 'CONFIRMED',
        confirmedBy: 'actor-1',
        confirmedAt: new Date('2026-01-03T00:00:00.000Z'),
        lines: [
          line({
            type: 'SERVICE',
            serviceId,
            unitPrice: 20,
            quantity: 1,
            subtotal: 20,
          }),
        ],
      }),
    )

    const result = await salesService.update(
      'sale-1',
      { customerId: null, lines: [{ type: 'SERVICE', serviceId }] },
      'actor-1',
      context,
    )

    expect(repository.update).toHaveBeenCalledWith('sale-1', {
      customerId: null,
      subtotal: 20,
      total: 20,
      lines: [
        expect.objectContaining({
          type: 'SERVICE',
          serviceId,
          unitPrice: 20,
          quantity: 1,
          subtotal: 20,
        }),
      ],
    })
    expect(result.data.status).toBe('CONFIRMED')
  })

  it('propaga el rechazo de edición de ventas confirmadas', async () => {
    repository.findServiceRef.mockResolvedValue({
      id: serviceId,
      code: 'SVC-1',
      name: 'Cambio de aceite',
      active: true,
      price: 20,
    })
    repository.update.mockRejectedValue(
      new (class extends Error {
        status = 409
        code = 'SALE_READONLY'
      })('Solo borradores'),
    )

    await expect(
      salesService.update(
        'sale-1',
        { customerId: null, lines: [{ type: 'SERVICE', serviceId }] },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({ status: 409, code: 'SALE_READONLY' })
  })

  it('confirma la venta y devuelve el detalle confirmado', async () => {
    repository.confirm.mockResolvedValue(
      record({
        status: 'CONFIRMED',
        confirmedBy: 'actor-1',
        confirmedAt: new Date('2026-01-03T00:00:00.000Z'),
      }),
    )

    const result = await salesService.confirm('sale-1', 'actor-1', context)

    expect(repository.confirm).toHaveBeenCalledWith(
      'sale-1',
      { id: 'actor-1', name: 'actor-1' },
      context,
    )
    expect(result.data.status).toBe('CONFIRMED')
  })

  it('mapea claves de idempotencia duplicadas en la creación', async () => {
    repository.findProductRef.mockResolvedValue({
      id: productId,
      code: 'FILTRO-01',
      name: 'Filtro de aceite',
      active: true,
      salePrice: 35.5,
      unit: { name: 'Unidad', symbol: 'ud' },
    })
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      salesService.create(input, 'actor-1', context),
    ).rejects.toMatchObject({
      status: 400,
      code: 'SALE_REFERENCE_INVALID',
    })
  })
})
