import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/infrastructure/api/client', () => ({ api }))

import { productsService } from './products.service'

describe('Servicio de productos (web)', () => {
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

  it('lista productos con filtros y paginación', async () => {
    await productsService.list({
      search: 'filtro',
      categoryId: 'cat1',
      status: 'active',
      page: 2,
      pageSize: 50,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/products?status=active&page=2&pageSize=50&search=filtro&categoryId=cat1',
      undefined,
    )
  })

  it('omite filtros vacíos en el query string', async () => {
    await productsService.list({
      search: '   ',
      categoryId: '',
      status: 'all',
      page: 1,
      pageSize: 20,
    })

    expect(api.get).toHaveBeenCalledWith(
      '/products?status=all&page=1&pageSize=20',
      undefined,
    )
  })

  it('consulta opciones y el detalle de un producto', async () => {
    await productsService.options()
    expect(api.get).toHaveBeenCalledWith('/products/options', undefined)

    await productsService.get('p1')
    expect(api.get).toHaveBeenCalledWith('/products/p1', undefined)
  })

  it('crea, actualiza y cambia el estado con los endpoints correctos', async () => {
    const input = {
      code: 'REP-001',
      barcode: null,
      name: 'Filtro',
      description: null,
      categoryId: 'cat1',
      brandId: null,
      unitId: 'unit1',
      salePrice: 10,
      minimumStock: 1,
    }

    await productsService.create(input)
    expect(api.post).toHaveBeenCalledWith('/products', input)

    await productsService.update('p1', input)
    expect(api.put).toHaveBeenCalledWith('/products/p1', input)

    await productsService.updateStatus('p1', false)
    expect(api.patch).toHaveBeenCalledWith('/products/p1/status', {
      active: false,
    })
  })

  it('crea categoría, marca y unidad desde el catálogo', async () => {
    await productsService.createCategory('Filtros')
    expect(api.post).toHaveBeenCalledWith('/products/categories', {
      name: 'Filtros',
    })

    await productsService.createBrand('ACDelco')
    expect(api.post).toHaveBeenCalledWith('/products/brands', {
      name: 'ACDelco',
    })

    await productsService.createUnit('Unidad', 'und')
    expect(api.post).toHaveBeenCalledWith('/products/units', {
      name: 'Unidad',
      symbol: 'und',
    })
  })

  it('administra los registros existentes del catálogo', async () => {
    await productsService.catalog()
    expect(api.get).toHaveBeenCalledWith('/products/catalog', undefined)

    await productsService.updateCategory('cat1', 'Filtros de aceite')
    expect(api.put).toHaveBeenCalledWith('/products/categories/cat1', {
      name: 'Filtros de aceite',
    })

    await productsService.updateBrandStatus('brand1', false)
    expect(api.patch).toHaveBeenCalledWith('/products/brands/brand1/status', {
      active: false,
    })

    await productsService.updateUnit('unit1', 'Unidad', 'und')
    expect(api.put).toHaveBeenCalledWith('/products/units/unit1', {
      name: 'Unidad',
      symbol: 'und',
    })
  })
})
