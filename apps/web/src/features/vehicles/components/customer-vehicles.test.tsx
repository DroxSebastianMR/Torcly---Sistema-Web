// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CustomerVehicles } from './customer-vehicles'

const vehicles = vi.hoisted(() => ({ useVehiclesByCustomer: vi.fn() }))
vi.mock('../hooks/use-vehicles', () => ({
  useVehiclesByCustomer: vehicles.useVehiclesByCustomer,
}))

const items = [
  {
    id: 'v1',
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2021,
    customerId: 'c1',
    owner: {
      id: 'c1',
      type: 'NATURAL' as const,
      documentNumber: '12345678',
      firstName: 'María',
      lastName: 'Pérez',
      legalName: null,
    },
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
]

function renderSection() {
  return render(
    <MemoryRouter initialEntries={['/clientes/c1']}>
      <Routes>
        <Route
          path="/clientes/:id"
          element={<CustomerVehicles customerId="c1" />}
        />
        <Route path="/vehiculos/:id" element={<div>Ficha de vehículo</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Sección de vehículos del cliente', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío', () => {
    vehicles.useVehiclesByCustomer.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      },
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderSection()

    expect(screen.getByText('Todavía no hay vehículos')).toBeTruthy()
  })

  it('lista las unidades y navega a su ficha', async () => {
    vehicles.useVehiclesByCustomer.mockReturnValue({
      data: {
        data: items,
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderSection()

    expect(screen.getByText('ABC123')).toBeTruthy()
    expect(screen.getByText('Toyota Corolla')).toBeTruthy()
    expect(screen.getByText('2021')).toBeTruthy()

    await userEvent.click(
      screen.getByRole('button', { name: 'Ver ficha de ABC123' }),
    )
    expect(screen.getByText('Ficha de vehículo')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    vehicles.useVehiclesByCustomer.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderSection()

    expect(screen.getByText('No se pudo cargar los vehículos')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })
})
