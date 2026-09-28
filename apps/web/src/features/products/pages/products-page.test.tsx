// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ProductsResponse } from '../types/products.types'
import Page from './products-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const products = vi.hoisted(() => ({
  useProducts: vi.fn(),
  useProductOptions: vi.fn(),
  useProductCatalog: vi.fn(),
  useProductMutations: vi.fn(),
}))
vi.mock('../hooks/use-products', () => ({
  productKeys: { all: ['products'], list: vi.fn(), detail: vi.fn() },
  useProducts: products.useProducts,
  useProductOptions: products.useProductOptions,
  useProductCatalog: products.useProductCatalog,
  useProductMutations: products.useProductMutations,
}))

vi.mock('../components/product-form-modal', () => ({
  ProductFormModal: () => null,
}))
vi.mock('../components/product-catalog-modal', () => ({
  ProductCatalogModal: () => null,
}))

const productMock = {
  id: 'p1',
  code: 'REP-001',
  barcode: null,
  name: 'Filtro de aceite',
  description: null,
  categoryId: 'cat1',
  brandId: null,
  unitId: 'unit1',
  salePrice: 35.5,
  minimumStock: 4,
  stock: 0,
  lowStock: true,
  active: true,
  category: { id: 'cat1', name: 'Filtros' },
  brand: null,
  unit: { id: 'unit1', name: 'Unidad', symbol: 'und' },
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function response(overrides: Partial<ProductsResponse> = {}): ProductsResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function options() {
  return {
    data: { categories: [], brands: [], units: [] },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/productos']}>
      <Routes>
        <Route path="/productos" element={<Page />} />
        <Route path="/productos/:id" element={<div>Ficha de producto</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Página de productos', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita las acciones según permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    products.useProducts.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(screen.getByRole('heading', { name: 'Productos' })).toBeTruthy()
    expect(screen.getByText('No se encontraron productos')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Registrar producto' }),
    ).toBeNull()
    expect(screen.queryByRole('button', { name: /Catálogos/ })).toBeNull()
  })

  it('muestra el registro y los catálogos con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    products.useProducts.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Registrar producto' }),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: /Catálogos/ })).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    products.useProducts.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(screen.getByLabelText('Cargando productos')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    products.useProducts.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(screen.getByText('No se pudo cargar el catálogo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista productos y navega a la ficha al abrir el detalle', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    products.useProducts.mockReturnValue({
      data: response({
        data: [productMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(screen.getAllByText('REP-001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Filtro de aceite').length).toBeGreaterThan(0)
    expect(screen.getByText('Stock bajo')).toBeTruthy()
    expect(screen.getByLabelText('Editar Filtro de aceite')).toBeTruthy()

    await userEvent.click(
      screen.getByRole('button', { name: 'Abrir ficha de Filtro de aceite' }),
    )
    expect(screen.getByText('Ficha de producto')).toBeTruthy()
  })

  it('omite acciones de escritura de la tabla sin permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    products.useProducts.mockReturnValue({
      data: response({
        data: [productMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(
      screen.queryByRole('button', { name: 'Editar Filtro de aceite' }),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Desactivar Filtro de aceite' }),
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Abrir ficha de Filtro de aceite' }),
    ).toBeTruthy()
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    products.useProducts.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Buscar productos' }),
    )
    await userEvent.type(
      await screen.findByPlaceholderText(
        'Escribe un código, nombre o categoría…',
      ),
      'honda',
    )

    await waitFor(() =>
      expect(products.useProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'honda' }),
      ),
    )
  })

  it('confirma la desactivación con el diálogo de confirmación', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    products.useProducts.mockReturnValue({
      data: response({
        data: [productMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())
    products.useProductMutations.mockReturnValue({
      status: { mutateAsync: vi.fn().mockResolvedValue({}) },
    })

    renderPage()

    const deactivateButtons = screen.getAllByRole('button', {
      name: 'Desactivar Filtro de aceite',
    })
    await userEvent.click(deactivateButtons[0])
    expect(
      await screen.findByRole('heading', { name: '¿Desactivar producto?' }),
    ).toBeTruthy()
  })
})
