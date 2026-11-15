// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any -- Los mocks parciales aíslan consultas y mutaciones del formulario. */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DirectWorkOrderModal } from './direct-work-order-modal'
import * as useWorkOrdersModule from '../hooks/use-work-orders'
import * as useCustomersModule from '@/features/customers/hooks/use-customers'
import * as customersServiceModule from '@/features/customers/services/customers.service'
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
  const mockCreateCustomer = vi.fn()

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

    vi.spyOn(
      customersServiceModule.customersService,
      'create',
    ).mockImplementation(
      mockCreateCustomer.mockResolvedValue({
        data: {
          id: 'new-cust-1',
          type: 'NATURAL',
          documentNumber: '87654321',
          firstName: 'Carlos',
          lastName: 'Mendoza',
          legalName: null,
          phone: '999888777',
          email: 'carlos@example.com',
          createdVehicle: {
            id: 'new-veh-1',
            plate: 'XYZ-789',
            brand: 'Nissan',
            model: 'Sentra',
            year: 2021,
            mileage: 45000,
          },
        },
      } as any),
    )

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

  it('renderiza los campos operativos sin el peritaje de recepción', () => {
    renderWithClient(<DirectWorkOrderModal open={true} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: /nueva orden directa en taller/i }),
    ).toBeTruthy()
    expect(screen.getByLabelText(/^cliente/i)).toBeTruthy()
    expect(screen.getByLabelText(/^vehículo/i)).toBeTruthy()
    expect(screen.getByLabelText(/kilometraje actual/i)).toBeTruthy()
    expect(screen.getByLabelText(/combustible/i)).toBeTruthy()
    expect(screen.queryByText(/checklist de recepción/i)).toBeNull()
    expect(screen.queryByLabelText(/llanta de repuesto/i)).toBeNull()
    expect(screen.getByLabelText(/¿es un cliente nuevo\?/i)).toBeTruthy()
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

  it('permite alternar al modo de cliente nuevo y muestra los campos de cliente y vehículo', () => {
    renderWithClient(<DirectWorkOrderModal open={true} onClose={vi.fn()} />)

    const toggle = screen.getByLabelText(/¿es un cliente nuevo\?/i)
    fireEvent.click(toggle)

    expect(screen.getByText(/1\. Datos del Nuevo Cliente/i)).toBeTruthy()
    expect(screen.getByText(/2\. Vehículo a Ingresar/i)).toBeTruthy()
    expect(screen.getByLabelText(/DNI \(8 dígitos\)/i)).toBeTruthy()
    expect(screen.getByLabelText(/Teléfono celular/i)).toBeTruthy()
    expect(screen.getByLabelText(/Placa/i)).toBeTruthy()
    expect(screen.getByLabelText(/Marca/i)).toBeTruthy()
    expect(screen.getByLabelText(/Modelo/i)).toBeTruthy()
    expect(screen.getByLabelText(/^Año/i)).toBeTruthy()
  })
})
