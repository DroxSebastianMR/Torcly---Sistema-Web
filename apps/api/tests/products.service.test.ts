import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Prisma } from '../src/generated/prisma/client.js'
import { AppError } from '../src/shared/errors/app-error.js'

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  getOptions: vi.fn(),
  createCategory: vi.fn(),
  createBrand: vi.fn(),
  createUnit: vi.fn(),
}))

vi.mock('../src/modules/products/products.repository.js', () => ({
  productsRepository: repository,
}))

import { productsService } from '../src/modules/products/products.service.js'

const context = {
  requestId: 'req-1',
  ipAddress: '127.0.0.1',
}

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    code: 'REP-001',
    barcode: '7751234567890',
    name: 'Filtro de aceite',
    description: null,
    categoryId: 'cat1',
    brandId: null,
    unitId: 'unit1',
    salePrice: 35.5,
    minimumStock: 4,
    active: true,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    category: { id: 'cat1', name: 'Filtros' },
    brand: null,
    unit: { id: 'unit1', name: 'Unidad', symbol: 'und' },
    inventoryMovements: [
      { type: 'INITIAL', quantity: 10 },
      { type: 'ENTRY', quantity: 5 },
      { type: 'EXIT', quantity: 3 },
    ],
    ...overrides,
  }
}

describe('Servicio de productos', () => {
  beforeEach(() => {
    for (const mock of Object.values(repository)) mock.mockReset()
  })

  it('lista productos con stock derivado de movimientos y paginación', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })

    const result = await productsService.list({
      search: 'filtro',
      categoryId: '',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(repository.list).toHaveBeenCalledWith({
      search: 'filtro',
      categoryId: '',
      status: 'all',
      page: 1,
      pageSize: 20,
    })
    expect(result).toEqual({
      data: [
        {
          id: 'p1',
          code: 'REP-001',
          barcode: '7751234567890',
          name: 'Filtro de aceite',
          description: null,
          categoryId: 'cat1',
          brandId: null,
          unitId: 'unit1',
          salePrice: 35.5,
          minimumStock: 4,
          stock: 12,
          lowStock: false,
          active: true,
          category: { id: 'cat1', name: 'Filtros' },
          brand: null,
          unit: { id: 'unit1', name: 'Unidad', symbol: 'und' },
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    })
  })

  it('marca stock bajo cuando el nivel disponible no supera el mínimo', async () => {
    repository.list.mockResolvedValue({ items: [record()], total: 1 })

    const result = await productsService.list({
      search: '',
      categoryId: '',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(result.data[0].lowStock).toBe(false)

    repository.list.mockResolvedValue({
      items: [record({ minimumStock: 12, inventoryMovements: [] })],
      total: 1,
    })

    const critical = await productsService.list({
      search: '',
      categoryId: '',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(critical.data[0].stock).toBe(0)
    expect(critical.data[0].lowStock).toBe(true)
  })

  it('crea un producto y audita con el actor y contexto de la petición', async () => {
    repository.create.mockResolvedValue(record())

    const result = await productsService.create(
      {
        code: 'REP-001',
        barcode: '7751234567890',
        name: 'Filtro de aceite',
        description: null,
        categoryId: 'cat1',
        brandId: null,
        unitId: 'unit1',
        salePrice: 35.5,
        minimumStock: 4,
      },
      'actor-1',
      context,
    )

    expect(repository.create).toHaveBeenCalledWith(
      {
        code: 'REP-001',
        barcode: '7751234567890',
        name: 'Filtro de aceite',
        description: null,
        categoryId: 'cat1',
        brandId: null,
        unitId: 'unit1',
        salePrice: 35.5,
        minimumStock: 4,
      },
      'actor-1',
      context,
    )
    expect(result.data.id).toBe('p1')
  })

  it('mapea un código duplicado a un error accionable', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicado', {
        code: 'P2002',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      productsService.create(
        {
          code: 'REP-001',
          barcode: null,
          name: 'Filtro',
          description: null,
          categoryId: 'cat1',
          brandId: null,
          unitId: 'unit1',
          salePrice: 10,
          minimumStock: 1,
        },
        'actor-1',
        context,
      ),
    ).rejects.toBeInstanceOf(AppError)
    await expect(
      productsService.create(
        {
          code: 'REP-001',
          barcode: null,
          name: 'Filtro',
          description: null,
          categoryId: 'cat1',
          brandId: null,
          unitId: 'unit1',
          salePrice: 10,
          minimumStock: 1,
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 409,
      code: 'PRODUCT_DUPLICATE',
    })
  })

  it('mapea una referencia de catálogo inválida al crear', async () => {
    repository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('FK rota', {
        code: 'P2003',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      productsService.create(
        {
          code: 'REP-002',
          barcode: null,
          name: 'Filtro',
          description: null,
          categoryId: 'cat1',
          brandId: null,
          unitId: 'unit1',
          salePrice: 10,
          minimumStock: 1,
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'PRODUCT_REFERENCE_INVALID',
    })
  })

  it('actualiza y audita el cambio con el actor y contexto', async () => {
    repository.update.mockResolvedValue(record({ salePrice: 42 }))

    const result = await productsService.update(
      'p1',
      {
        code: 'REP-001',
        barcode: '7751234567890',
        name: 'Filtro de aceite',
        description: null,
        categoryId: 'cat1',
        brandId: null,
        unitId: 'unit1',
        salePrice: 42,
        minimumStock: 4,
      },
      'actor-1',
      context,
    )

    expect(repository.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ salePrice: 42 }),
      'actor-1',
      context,
    )
    expect(result.data.salePrice).toBe(42)
  })

  it('informa un producto inexistente al actualizar', async () => {
    repository.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('No existe', {
        code: 'P2025',
        clientVersion: '7.10.0',
      }),
    )

    await expect(
      productsService.update(
        'p1',
        {
          code: 'REP-001',
          barcode: null,
          name: 'Filtro',
          description: null,
          categoryId: 'cat1',
          brandId: null,
          unitId: 'unit1',
          salePrice: 10,
          minimumStock: 1,
        },
        'actor-1',
        context,
      ),
    ).rejects.toMatchObject({
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  })

  it('cambia el estado y audita con el actor y contexto', async () => {
    repository.updateStatus.mockResolvedValue(record({ active: false }))

    const result = await productsService.updateStatus(
      'p1',
      false,
      'actor-1',
      context,
    )

    expect(repository.updateStatus).toHaveBeenCalledWith(
      'p1',
      false,
      'actor-1',
      context,
    )
    expect(result.data.active).toBe(false)
  })

  it('rechaza productos inexistentes en el detalle', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(productsService.getById('p1')).rejects.toMatchObject({
      status: 404,
      code: 'PRODUCT_NOT_FOUND',
    })
  })

  it('mapea la consulta de detalle y expone el stock de solo lectura', async () => {
    repository.findById.mockResolvedValue(record())

    const result = await productsService.getById('p1')
    expect(result.data.code).toBe('REP-001')
    expect(result.data.stock).toBe(12)
    expect(repository.findById).toHaveBeenCalledWith('p1')
  })

  it('consulta opciones de catálogo y crea categoría, marca y unidad', async () => {
    repository.getOptions.mockResolvedValue({
      categories: [{ id: 'cat1', name: 'Filtros' }],
      brands: [],
      units: [{ id: 'unit1', name: 'Unidad', symbol: 'und' }],
    })
    repository.createCategory.mockResolvedValue({ id: 'c1', name: 'Filtros' })
    repository.createBrand.mockResolvedValue({ id: 'b1', name: 'ACDelco' })
    repository.createUnit.mockResolvedValue({
      id: 'u1',
      name: 'Unidad',
      symbol: 'und',
    })

    await expect(productsService.getOptions()).resolves.toEqual({
      data: {
        categories: [{ id: 'cat1', name: 'Filtros' }],
        brands: [],
        units: [{ id: 'unit1', name: 'Unidad', symbol: 'und' }],
      },
    })
    await expect(productsService.createCategory('Filtros')).resolves.toEqual({
      data: { id: 'c1', name: 'Filtros' },
    })
    await expect(productsService.createBrand('ACDelco')).resolves.toEqual({
      data: { id: 'b1', name: 'ACDelco' },
    })
    await expect(productsService.createUnit('Unidad', 'und')).resolves.toEqual({
      data: { id: 'u1', name: 'Unidad', symbol: 'und' },
    })
  })
})
