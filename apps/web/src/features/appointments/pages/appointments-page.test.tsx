// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppointmentsResponse } from '../types/appointments.types'
import Page from './appointments-page'

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }))
vi.mock('@/features/auth/hooks/auth-context', () => auth)

const appointments = vi.hoisted(() => ({
  useAppointments: vi.fn(),
  useAppointment: vi.fn(),
  useAppointmentMutations: vi.fn(),
}))
vi.mock('../hooks/use-appointments', () => ({
  appointmentKeys: { all: ['appointments'] },
  useAppointments: appointments.useAppointments,
  useAppointment: appointments.useAppointment,
  useAppointmentMutations: appointments.useAppointmentMutations,
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const reactQuery =
    await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...reactQuery,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }
})

const customers = vi.hoisted(() => ({ useCustomers: vi.fn() }))
vi.mock('@/features/customers/hooks/use-customers', () => customers)

vi.mock('../components/appointment-detail-modal', () => ({
  AppointmentDetailModal: () => null,
}))
vi.mock('../components/appointment-form-modal', () => ({
  AppointmentFormModal: () => null,
}))
vi.mock('@/components/ui/confirmation-dialog', () => ({
  ConfirmationDialog: () => null,
}))

const appointmentMock = {
  id: 'a1',
  code: 'CITA-000001',
  customer: { id: 'c1', documentNumber: '20123456789', name: 'Motorparts SAC' },
  vehicle: {
    id: 'v1',
    plate: 'ABC-123',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2021,
  },
  date: '2099-12-31',
  time: '10:00',
  reason: 'Cambio de aceite',
  status: 'PROGRAMADA' as const,
  performedBy: 'Admin',
  rescheduledBy: null,
  rescheduledAt: null,
  cancelledBy: null,
  cancelledAt: null,
  attendedBy: null,
  attendedAt: null,
  workOrder: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function response(
  overrides: Partial<AppointmentsResponse> = {},
): AppointmentsResponse {
  return {
    data: [],
    pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    summary: { total: 0, programadas: 0, canceladas: 0, hoy: 0 },
    ...overrides,
  }
}

function renderPage() {
  return render(<Page />)
}

function defaultMocks(permissions: string[]) {
  auth.useAuth.mockReturnValue({ user: { permissions } })
  customers.useCustomers.mockReturnValue({
    data: {
      data: [],
      pagination: { page: 1, pageSize: 100, total: 0, totalPages: 0 },
    },
  })
  appointments.useAppointmentMutations.mockReturnValue({
    create: { isPending: false, mutateAsync: vi.fn() },
    reschedule: { isPending: false, mutateAsync: vi.fn() },
    cancel: { isPending: false, mutateAsync: vi.fn() },
  })
}

describe('Página de citas', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el estado vacío y limita el registro según permiso', () => {
    defaultMocks(['appointments:read'])
    appointments.useAppointments.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    appointments.useAppointment.mockReturnValue({
      data: undefined,
      isPending: false,
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'Citas' })).toBeTruthy()
    expect(screen.getByText('No se encontraron citas')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Nueva cita' })).toBeNull()
  })

  it('muestra el registro con permiso de escritura', () => {
    defaultMocks(['appointments:read', 'appointments:write'])
    appointments.useAppointments.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    appointments.useAppointment.mockReturnValue({
      data: undefined,
      isPending: false,
    })

    renderPage()

    expect(screen.getByRole('button', { name: 'Nueva cita' })).toBeTruthy()
  })

  it('muestra el estado de carga mientras consulta', () => {
    defaultMocks(['appointments:read'])
    appointments.useAppointments.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      isError: false,
      refetch: vi.fn(),
    })
    appointments.useAppointment.mockReturnValue({
      data: undefined,
      isPending: false,
    })

    renderPage()

    expect(screen.getByLabelText('Cargando citas')).toBeTruthy()
  })

  it('muestra el estado de error con reintento', () => {
    defaultMocks(['appointments:read'])
    appointments.useAppointments.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    })
    appointments.useAppointment.mockReturnValue({
      data: undefined,
      isPending: false,
    })

    renderPage()

    expect(screen.getByText('No se pudo cargar las citas')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })

  it('lista las citas con cliente, vehículo y estado, y muestra el resumen', () => {
    defaultMocks(['appointments:read'])
    appointments.useAppointments.mockReturnValue({
      data: response({
        data: [appointmentMock],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        summary: { total: 1, programadas: 1, canceladas: 0, hoy: 1 },
      }),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    appointments.useAppointment.mockReturnValue({
      data: undefined,
      isPending: false,
    })

    renderPage()

    expect(screen.getAllByText('CITA-000001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Motorparts SAC').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('ABC-123 · Toyota Hilux').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Programada').length).toBeGreaterThan(0)
    expect(screen.getByText('para hoy')).toBeTruthy()
  })

  it('envía la búsqueda a la consulta al escribir en el selector', async () => {
    defaultMocks(['appointments:read'])
    appointments.useAppointments.mockReturnValue({
      data: response(),
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
    appointments.useAppointment.mockReturnValue({
      data: undefined,
      isPending: false,
    })

    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Buscar citas' }))
    await user.type(
      await screen.findByPlaceholderText(
        'Escribe un código, cliente, placa o motivo…',
      ),
      'HILUX',
    )

    await waitFor(() =>
      expect(appointments.useAppointments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'HILUX' }),
      ),
    )
  })
})
