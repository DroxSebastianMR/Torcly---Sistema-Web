// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SalesResponse } from '../types/sales.types'
import Page from './sales-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const sales = vi.hoisted(() => ({
  useSales: vi.fn(),
  useSale: vi.fn(),
}))
vi.mock('../hooks/use-sales', () => ({
  saleKeys: { all: ['sales'] },
  useSales: sales.useSales,
  useSale: sales.useSale,
}))

vi.mock('../components/sale-detail-modal', () => ({
  SaleDetailModal: () => null,
}))
vi.mock('../components/sale-form-modal', () => ({
  SaleFormModal: () => null,
}))

const saleMock = {
  id: 's1',
  code: 'VENTA-000001',
  customer: { id: 'c1', documentNumber: '20123456789', name: 'Motorparts SAC' },
  status: 'DRAFT' as const,
  subtotal: 25,
  total: 25,
  lineCount: 1,
  performedBy: 'Admin',
  confirmedBy: null,
  confirmedAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function response(overrides: Partial<SalesResponse> = {}): SalesResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function renderPage() {
  return render(<Page />)
}

describe('Página de ventas', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita el registro según permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['sales:read'] } })
    sales.useSales.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    sales.useSale.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Ventas' })).toBeTruthy()
    expect(screen.getByText('No se encontraron ventas')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nueva venta' })).toBeNull()
  })

  it('muestra el registro con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['sales:read', 'sales:write'] },
    })
    sales.useSales.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    sales.useSale.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getByRole('button', { name: 'Nueva venta' })).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['sales:read'] } })
    sales.useSales.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })
    sales.useSale.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getByLabelText('Cargando ventas')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['sales:read'] } })
    sales.useSales.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })
    sales.useSale.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getByText('No se pudo cargar las ventas')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista las ventas con cliente y estado', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['sales:read'] } })
    sales.useSales.mockReturnValue({
      data: response({
        data: [saleMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    sales.useSale.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    expect(screen.getAllByText('VENTA-000001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Motorparts SAC').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Borrador').length).toBeGreaterThan(0)
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['sales:read'] } })
    sales.useSales.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    sales.useSale.mockReturnValue({ data: undefined, isPending: false })

    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Buscar ventas' }))
    await userEvent.type(
      await screen.findByPlaceholderText(
        'Escribe un código, cliente o documento…',
      ),
      'bomba',
    )

    await waitFor(() =>
      expect(sales.useSales).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'bomba' }),
      ),
    )
  })
})
