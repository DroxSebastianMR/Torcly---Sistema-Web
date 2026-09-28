// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { CustomersResponse } from '../types/customers.types'
import Page from './customers-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const customers = vi.hoisted(() => ({
  useCustomers: vi.fn(),
  useCustomer: vi.fn(),
  useCustomerMutations: vi.fn(),
}))
vi.mock('../hooks/use-customers', () => ({
  customerKeys: { all: ['customers'], list: vi.fn(), detail: vi.fn() },
  useCustomers: customers.useCustomers,
  useCustomer: customers.useCustomer,
  useCustomerMutations: customers.useCustomerMutations,
}))

vi.mock('../components/customer-form-modal', () => ({
  CustomerFormModal: () => null,
}))

function response(
  overrides: Partial<CustomersResponse> = {},
): CustomersResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>,
  )
}

describe('Página de clientes', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita la creación según permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['customers:read'] } })
    customers.useCustomers.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeTruthy()
    expect(screen.getByText('No se encontraron clientes')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Registrar cliente' }),
    ).toBeNull()
  })

  it('muestra el botón de registrar con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['customers:read', 'customers:write'] },
    })
    customers.useCustomers.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Registrar cliente' }),
    ).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['customers:read'] } })
    customers.useCustomers.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByLabelText('Cargando clientes')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['customers:read'] } })
    customers.useCustomers.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('No se pudo cargar los clientes')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })
})
