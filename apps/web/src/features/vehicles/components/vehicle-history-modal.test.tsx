// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Vehicle } from '../types/vehicles.types'
import { VehicleHistoryModal } from './vehicle-history-modal'

const historyHook = vi.hoisted(() => ({
  useVehicleHistory: vi.fn(),
}))

vi.mock('../hooks/use-vehicles', () => ({
  useVehicleHistory: historyHook.useVehicleHistory,
}))

const vehicleMock: Vehicle = {
  id: 'v1',
  plate: 'XYZ999',
  brand: 'Nissan',
  model: 'Sentra',
  year: 2020,
  customerId: 'c1',
  owner: {
    id: 'c1',
    type: 'NATURAL',
    documentNumber: '87654321',
    firstName: 'Juan',
    lastName: 'Gómez',
    legalName: null,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderModal({
  open = true,
  vehicle = vehicleMock,
}: { open?: boolean; vehicle?: Vehicle | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <VehicleHistoryModal open={open} vehicle={vehicle} onClose={vi.fn()} />
    </QueryClientProvider>,
  )
}

describe('VehicleHistoryModal', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío cuando la unidad no registra atenciones previas', () => {
    historyHook.useVehicleHistory.mockReturnValue({
      data: {
        vehicle: vehicleMock,
        summary: {
          totalVisits: 0,
          totalSpent: 0,
          lastMileage: null,
          lastVisitAt: null,
        },
        timeline: [],
      },
      isLoading: false,
      isError: false,
    })

    renderModal()

    expect(screen.getByText('XYZ999')).toBeTruthy()
    expect(screen.getByText('Nissan Sentra')).toBeTruthy()
    expect(screen.getByText('Sin historial de atenciones')).toBeTruthy()
    expect(
      screen.getByText(
        'Este vehículo aún no cuenta con órdenes de trabajo registradas en el taller.',
      ),
    ).toBeTruthy()
  })

  it('renderiza resumen de métricas y timeline con atenciones, servicios y repuestos', () => {
    historyHook.useVehicleHistory.mockReturnValue({
      data: {
        vehicle: vehicleMock,
        summary: {
          totalVisits: 2,
          totalSpent: 520,
          lastMileage: 62000,
          lastVisitAt: '2026-03-01T10:00:00.000Z',
        },
        timeline: [
          {
            id: 'wo-1',
            code: 'OT-000100',
            status: 'ENTREGADA',
            source: 'DIRECT',
            entryDate: '2026-03-01T10:00:00.000Z',
            deliveredDate: '2026-03-01T15:00:00.000Z',
            mileage: 62000,
            fuelLevel: 'HALF',
            diagnosis: 'Revisión periódica de frenos',
            receptionNotes: null,
            technician: { id: 't1', fullName: 'Pedro Mecánico' },
            services: [
              {
                id: 's1',
                name: 'Rectificado de discos',
                code: 'SRV-REC',
                quantity: 2,
                unitPrice: 80,
                subtotal: 160,
              },
            ],
            parts: [
              {
                id: 'p1',
                name: 'Pastillas de freno Bosch',
                code: 'PRD-PAS',
                unitLabel: 'JGO',
                quantity: 1,
                unitPrice: 180,
                subtotal: 180,
              },
            ],
            total: 340,
          },
        ],
      },
      isLoading: false,
      isError: false,
    })

    renderModal()

    expect(screen.getByText('XYZ999')).toBeTruthy()
    expect(screen.getByText('atenciones')).toBeTruthy()
    expect(screen.getByText('S/ 520.00')).toBeTruthy()
    expect(screen.getAllByText('62,000 km').length).toBeGreaterThan(0)

    expect(screen.getByText('OT-000100')).toBeTruthy()
    expect(screen.getByText('Entregada')).toBeTruthy()
    expect(screen.getByText(/Pedro Mecánico/)).toBeTruthy()
    expect(screen.getByText('Rectificado de discos')).toBeTruthy()
    expect(screen.getByText(/Pastillas de freno Bosch/)).toBeTruthy()
    expect(screen.getByText('S/ 340.00')).toBeTruthy()
  })
})
