// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { VehiclesResponse } from '../types/vehicles.types'
import Page from './vehicles-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const vehicles = vi.hoisted(() => ({ useVehicles: vi.fn() }))
vi.mock('../hooks/use-vehicles', () => ({
  vehicleKeys: { all: ['vehicles'], list: vi.fn(), detail: vi.fn() },
  useVehicles: vehicles.useVehicles,
  useVehicle: vi.fn(),
  useVehiclesByCustomer: vi.fn(),
}))

vi.mock('../components/vehicle-form-modal', () => ({
  VehicleFormModal: () => null,
}))

const vehicleMock = {
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
}

function response(overrides: Partial<VehiclesResponse> = {}): VehiclesResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/vehiculos']}>
      <Routes>
        <Route path="/vehiculos" element={<Page />} />
        <Route path="/vehiculos/:id" element={<div>Ficha de vehículo</div>} />
        <Route path="/clientes/:id" element={<div>Ficha de cliente</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Página de vehículos', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita la creación según permiso', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicles.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Vehículos' })).toBeTruthy()
    expect(screen.getByText('No se encontraron vehículos')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Registrar vehículo' }),
    ).toBeNull()
  })

  it('muestra el botón de registrar con permiso de escritura', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['vehicles:read', 'vehicles:write'] },
    })
    vehicles.useVehicles.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(
      screen.getByRole('button', { name: 'Registrar vehículo' }),
    ).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicles.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByLabelText('Cargando vehículos')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicles.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getByText('No se pudo cargar los vehículos')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista vehículos y navega a la ficha y al propietario', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicles.mockReturnValue({
      data: response({
        data: [vehicleMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    expect(screen.getAllByText('ABC123').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Toyota Corolla/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/María Pérez/).length).toBeGreaterThan(0)
    expect(screen.getByText(/DNI\s+12345678/)).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'ABC123' }))
    expect(screen.getByText('Ficha de vehículo')).toBeTruthy()
  })

  it('ejecuta la búsqueda y la reenvía a la consulta', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicles.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'Buscar vehículos' }),
    )
    await userEvent.type(
      await screen.findByPlaceholderText(
        'Escribe placa, propietario o documento…',
      ),
      'honda',
    )

    await waitFor(() =>
      expect(vehicles.useVehicles).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'honda' }),
      ),
    )
  })

  it('navega al propietario desde la tarjeta móvil', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicles.mockReturnValue({
      data: response({
        data: [vehicleMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Propietario' }))
    expect(screen.getByText('Ficha de cliente')).toBeTruthy()
  })
})
