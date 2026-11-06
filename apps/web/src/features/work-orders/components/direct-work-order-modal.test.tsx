// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DirectWorkOrderModal } from './direct-work-order-modal'
import * as useWorkOrdersModule from '../hooks/use-work-orders'
import * as useCustomersModule from '@/features/customers/hooks/use-customers'
import * as vehiclesServiceModule from '@/features/vehicles/services/vehicles.service'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('DirectWorkOrderModal', () => {
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    vi.spyOn(useWorkOrdersModule, 'useYardCapacity').mockReturnValue({
      data: {
        maxCapacity: 8,
        occupiedBays: 5,
        availableBays: 3,
        occupancyRate: 62.5,
        isAtCapacity: false,
        todayEntriesCount: 4,
        todayWalkInsCount: 2,
        todayAppointmentsCount: 2,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    vi.spyOn(useWorkOrdersModule, 'useWorkOrdersMutations').mockReturnValue({
      createDirect: {
        mutateAsync: mockMutateAsync.mockResolvedValue({
          data: { id: 'wo-1', code: 'OT-000001' },
        }),
        isPending: false,
      },
    } as any)

    vi.spyOn(useCustomersModule, 'useCustomers').mockReturnValue({
      data: {
        data: [
          {
            id: 'cust-1',
            type: 'INDIVIDUAL',
            documentNumber: '12345678',
            firstName: 'Juan',
            lastName: 'Pérez',
            legalName: null,
            phone: '987654321',
            email: 'juan@example.com',
            active: true,
          },
        ],
        pagination: { total: 1, page: 1, pageSize: 100, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    vi.spyOn(vehiclesServiceModule.vehiclesService, 'list').mockResolvedValue({
      data: [
        {
          id: 'veh-1',
          plate: 'ABC-123',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2020,
          customerId: 'cust-1',
          createdAt: '',
          updatedAt: '',
        },
      ],
      pagination: { total: 1, page: 1, pageSize: 100, totalPages: 1 },
    } as any)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renderiza los campos de cliente, vehículo, kilometraje y combustible', () => {
    renderWithClient(<DirectWorkOrderModal open={true} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: /nueva orden directa en taller/i }),
    ).toBeTruthy()
    expect(screen.getByLabelText(/cliente/i)).toBeTruthy()
    expect(screen.getByLabelText(/vehículo/i)).toBeTruthy()
    expect(screen.getByLabelText(/kilometraje actual/i)).toBeTruthy()
    expect(screen.getByLabelText(/nivel de combustible/i)).toBeTruthy()
  })

  it('muestra aviso de patio lleno cuando el aforo alcanza 8/8 bahías', () => {
    vi.spyOn(useWorkOrdersModule, 'useYardCapacity').mockReturnValue({
      data: {
        maxCapacity: 8,
        occupiedBays: 8,
        availableBays: 0,
        occupancyRate: 100,
        isAtCapacity: true,
        todayEntriesCount: 8,
        todayWalkInsCount: 4,
        todayAppointmentsCount: 4,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderWithClient(<DirectWorkOrderModal open={true} onClose={vi.fn()} />)

    expect(
      screen.getByText(/capacidad de patio al 100% \(8\/8 bahías ocupadas\)/i),
    ).toBeTruthy()
  })
})
