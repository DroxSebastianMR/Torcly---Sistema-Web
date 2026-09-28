// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ExistenceResponse } from '../types/inventory.types'
import Page from './inventory-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const inventory = vi.hoisted(() => ({
  useExistence: vi.fn(),
  useInventoryProductOptions: vi.fn(),
  useMovements: vi.fn(),
}))
vi.mock('../hooks/use-inventory', () => ({
  inventoryKeys: { all: ['inventory'] },
  useExistence: inventory.useExistence,
  useInventoryProductOptions: inventory.useInventoryProductOptions,
  useMovements: inventory.useMovements,
}))

vi.mock('../components/movement-form-modal', () => ({
  MovementFormModal: () => null,
}))

const item = {
  productId: 'p1',
  code: 'REP-001',
  name: 'Filtro de aceite',
  unit: { name: 'Unidad', symbol: 'und' },
  active: true,
  stock: 5,
  minimumStock: 4,
  lowStock: false,
  lastMovementAt: null,
}

function response(
  overrides: Partial<ExistenceResponse> = {},
): ExistenceResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function productOptions() {
  return { data: [] as ExistenceResponse['data'] }
}

function renderPage() {
  return render(<Page />)
}

describe('Página de inventario', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita las acciones según permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    inventory.useExistence.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeTruthy()
    expect(screen.getByText('No se encontraron existencias')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Stock inicial' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Entrada' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Salida' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ajuste' })).toBeNull()
  })

  it('muestra las acciones de movimiento con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['inventory:read', 'inventory:write'] },
    })
    inventory.useExistence.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('button', { name: 'Stock inicial' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Entrada' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Salida' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ajuste' })).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    inventory.useExistence.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByLabelText('Cargando existencias')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    inventory.useExistence.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByText('No se pudieron cargar las existencias'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista las existencias con stock bajo y en orden', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    inventory.useExistence.mockReturnValue({
      data: response({
        data: [
          item,
          {
            ...item,
            productId: 'p2',
            code: 'REP-002',
            name: 'Balata',
            stock: 1,
            minimumStock: 4,
            lowStock: true,
          },
        ],
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getAllByText('Filtro de aceite').length).toBeGreaterThan(0)
    expect(screen.getAllByText('REP-001').length).toBeGreaterThan(0)
    expect(screen.getByText('En orden')).toBeTruthy()
    expect(screen.getAllByText('Stock bajo').length).toBeGreaterThan(0)
    expect(screen.getByText('Por debajo del mínimo')).toBeTruthy()
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    inventory.useExistence.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Buscar existencias' }),
    )
    await userEvent.type(
      await screen.findByPlaceholderText('Escribe un código o nombre…'),
      'filtro',
    )

    await waitFor(() =>
      expect(inventory.useExistence).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'filtro' }),
      ),
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Limpiar búsqueda de existencias' }),
    )

    await waitFor(() =>
      expect(inventory.useExistence).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '' }),
      ),
    )
  })

  it('cambia a la pestaña de historial y muestra su estado vacío', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['inventory:read'] } })
    inventory.useExistence.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    inventory.useInventoryProductOptions.mockReturnValue(productOptions())
    inventory.useMovements.mockReturnValue({
      data: response({ data: [] as ExistenceResponse['data'] }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    await userEvent.click(screen.getByRole('tab', { name: 'Historial' }))

    expect(screen.getByText('Sin movimientos registrados')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Filtrar por producto' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Filtrar por tipo de movimiento' }),
    ).toBeTruthy()
  })
})
