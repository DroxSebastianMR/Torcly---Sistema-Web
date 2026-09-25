// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Customer } from '../types/customers.types'
import Page from './customer-detail-page'

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

const existingCustomer: Customer = {
  id: 'c1',
  type: 'NATURAL',
  documentNumber: '12345678',
  firstName: 'María',
  lastName: 'Pérez',
  legalName: null,
  phone: '987654321',
  email: 'maria@torcly.local',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-02-03T00:00:00.000Z',
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/clientes/c1']}>
      <Routes>
        <Route path="/clientes/:id" element={<Page />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Ficha de cliente', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['customers:read'] } })
    customers.useCustomer.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(
      screen.queryByRole('button', { name: 'Volver a clientes' }),
    ).toBeNull()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['customers:read'] } })
    customers.useCustomer.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(
      screen.getByText('No se pudo cargar la ficha del cliente'),
    ).toBeTruthy()
  })

  it('muestra la ficha con datos y las secciones vacías preparadas', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['customers:read', 'customers:write'] },
    })
    customers.useCustomer.mockReturnValue({
      data: existingCustomer,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByRole('heading', { name: 'María Pérez' })).toBeTruthy()
    expect(screen.getByText('12345678')).toBeTruthy()
    expect(screen.getByText('987654321')).toBeTruthy()

    expect(
      screen.getByRole('heading', { name: 'Vehículos del cliente' }),
    ).toBeTruthy()
    expect(screen.getByText('Todavía no hay vehículos')).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'Historial del cliente' }),
    ).toBeTruthy()
    expect(screen.getByText('Historial en blanco')).toBeTruthy()

    expect(screen.getByRole('button', { name: 'Editar cliente' })).toBeTruthy()
  })

  it('oculta la edición sin permiso de escritura', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['customers:read'] } })
    customers.useCustomer.mockReturnValue({
      data: existingCustomer,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.queryByRole('button', { name: 'Editar cliente' })).toBeNull()
  })
})
