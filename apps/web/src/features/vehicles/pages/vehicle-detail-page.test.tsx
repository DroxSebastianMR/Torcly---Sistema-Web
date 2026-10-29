// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Page from './vehicle-detail-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const vehicles = vi.hoisted(() => ({ useVehicle: vi.fn() }))
vi.mock('../hooks/use-vehicles', () => ({
  vehicleKeys: { all: ['vehicles'], list: vi.fn(), detail: vi.fn() },
  useVehicles: vi.fn(),
  useVehicle: vehicles.useVehicle,
  useVehiclesByCustomer: vi.fn(),
}))

const reactQuery = vi.hoisted(() => ({ useQuery: vi.fn() }))
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...original,
    useQuery: reactQuery.useQuery,
  }
})

vi.mock('../components/vehicle-form-modal', () => ({
  VehicleFormModal: () => null,
}))

const existingPlate = {
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

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/vehiculos/v1']}>
      <Routes>
        <Route path="/vehiculos/:id" element={<Page />} />
        <Route path="/clientes/:id" element={<div>Ficha de cliente</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Ficha de vehículo', () => {
  beforeEach(() => {
    reactQuery.useQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra la ficha con datos, propietario e historial en blanco', async () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['vehicles:read', 'vehicles:write'] },
    })
    vehicles.useVehicle.mockReturnValue({
      data: existingPlate,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByRole('heading', { name: 'ABC123' })).toBeTruthy()
    expect(screen.getByText('Toyota Corolla · 2021')).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'Datos del vehículo' }),
    ).toBeTruthy()
    expect(screen.getByText(/DNI\s+12345678/)).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: 'Historial técnico' }),
    ).toBeTruthy()
    expect(screen.getByText('Historial técnico en blanco')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Editar vehículo' })).toBeTruthy()
  })

  it('navega al propietario', async () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicle.mockReturnValue({
      data: existingPlate,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderDetail()

    await userEvent.click(screen.getByRole('button', { name: 'María Pérez' }))
    expect(screen.getByText('Ficha de cliente')).toBeTruthy()
  })

  it('oculta la edición sin permiso de escritura', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicle.mockReturnValue({
      data: existingPlate,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.queryByRole('button', { name: 'Editar vehículo' })).toBeNull()
  })

  it('muestra el estado de error con reintento', () => {
    auth.useAuth.mockReturnValue({ user: { permissions: ['vehicles:read'] } })
    vehicles.useVehicle.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(
      screen.getByText('No se pudo cargar la ficha del vehículo'),
    ).toBeTruthy()
  })

  it('muestra el historial técnico con el permiso de taller', () => {
    auth.useAuth.mockReturnValue({
      user: { permissions: ['vehicles:read', 'workshop:read'] },
    })
    vehicles.useVehicle.mockReturnValue({
      data: existingPlate,
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    reactQuery.useQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'wo1',
            code: 'OT-000001',
            diagnosis: 'Revisión de frenos',
            technicianId: 't1',
            technician: 'Juan',
            performedBy: 'Ana',
            deliveredBy: 'Ana',
            deliveredAt: '2026-09-28T00:00:00.000Z',
            subtotal: 100,
            total: 120,
            activities: [
              {
                id: 'a1',
                description: 'Cambiar pastillas',
                status: 'COMPLETADA' as const,
                performedBy: 'Juan',
                occurredAt: '2026-09-28T00:00:00.000Z',
              },
            ],
            products: [
              {
                lineId: 'l1',
                productId: 'p1',
                name: 'Pastillas',
                code: 'PAS-01',
                unitLabel: 'und',
                quantity: 1,
              },
            ],
          },
        ],
        pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    })

    renderDetail()

    expect(screen.getByText('OT-000001')).toBeTruthy()
    expect(screen.getByText('Técnico: Juan')).toBeTruthy()
    expect(screen.getByText('1 und Pastillas')).toBeTruthy()
    expect(screen.getByText('Revisión de frenos')).toBeTruthy()
  })
})
