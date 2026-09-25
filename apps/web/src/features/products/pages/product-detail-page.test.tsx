// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Product } from '../types/products.types'
import Page from './product-detail-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const products = vi.hoisted(() => ({
  useProduct: vi.fn(),
  useProductOptions: vi.fn(),
  useProductMutations: vi.fn(),
}))
vi.mock('../hooks/use-products', () => ({
  productKeys: { all: ['products'], detail: vi.fn(), list: vi.fn() },
  useProduct: products.useProduct,
  useProductOptions: products.useProductOptions,
  useProductMutations: products.useProductMutations,
}))

vi.mock('../components/product-form-modal', () => ({
  ProductFormModal: () => null,
}))

const productMock: Product = {
  id: 'p1',
  code: 'REP-001',
  barcode: '7751234567890',
  name: 'Filtro de aceite',
  description: 'Mantenimiento preventivo',
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

function options() {
  return {
    data: {
      categories: [{ id: 'cat1', name: 'Filtros' }],
      brands: [],
      units: [{ id: 'unit1', name: 'Unidad', symbol: 'und' }],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/productos/p1']}>
      <Routes>
        <Route path="/productos/p1" element={<Page />} />
        <Route path="/productos" element={<div>Lista de productos</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function useProductLoaded(data: Product | undefined) {
  products.useProduct.mockReturnValue({
    data,
    isPending: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  })
  products.useProductOptions.mockReturnValue(options())
  products.useProductMutations.mockReturnValue({
    status: { mutateAsync: vi.fn().mockResolvedValue({}) },
  })
}

describe('Ficha de producto', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra los datos comerciales y la existencia de solo lectura', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    useProductLoaded(productMock)

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Filtro de aceite' }),
    ).toBeTruthy()
    expect(screen.getAllByText('REP-001').length).toBeGreaterThan(0)
    expect(screen.getByText('Filtros')).toBeTruthy()
    expect(screen.getByText('S/ 35.50')).toBeTruthy()
    expect(screen.getByText('Activo')).toBeTruthy()
    expect(screen.getByText('Mantenimiento preventivo')).toBeTruthy()
    expect(
      screen.getByText(/las existencias se administran desde Inventario/i),
    ).toBeTruthy()
    expect(
      screen.getByText('El stock está por debajo del mínimo configurado.'),
    ).toBeTruthy()
  })

  it('omite las acciones de escritura sin permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    useProductLoaded(productMock)

    renderPage()

    expect(screen.queryByRole('button', { name: 'Editar producto' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).toBeNull()
  })

  it('muestra las acciones de edición y estado con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    useProductLoaded(productMock)

    renderPage()

    expect(screen.getByRole('button', { name: 'Editar producto' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Desactivar producto' }),
    ).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['products:read'] } })
    products.useProduct.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())

    renderPage()

    expect(
      screen.getByText('No se pudo cargar la ficha del producto'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('confirma la desactivación y actualiza el estado', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    const status = { mutateAsync: vi.fn().mockResolvedValue({}) }
    products.useProduct.mockReturnValue({
      data: productMock,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    products.useProductOptions.mockReturnValue(options())
    products.useProductMutations.mockReturnValue({ status })

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Desactivar producto' }),
    )
    expect(
      screen.getByRole('heading', { name: '¿Desactivar producto?' }),
    ).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }))
    await waitFor(() =>
      expect(status.mutateAsync).toHaveBeenCalledWith({
        id: 'p1',
        active: false,
      }),
    )
  })

  it('regresa a la lista desde la ficha', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['products:read', 'products:write'] },
    })
    useProductLoaded(productMock)

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Volver a productos' }),
    )
    expect(screen.getByText('Lista de productos')).toBeTruthy()
  })
})
