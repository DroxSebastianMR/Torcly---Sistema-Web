// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppointmentFormModal } from './appointment-form-modal'
import type { Appointment } from '../types/appointments.types'

const query = vi.hoisted(() => ({ useQuery: vi.fn() }))
vi.mock('@tanstack/react-query', () => query)

const appointments = vi.hoisted(() => ({ useAppointmentMutations: vi.fn() }))
vi.mock('../hooks/use-appointments', () => appointments)

const customers = vi.hoisted(() => ({ useCustomers: vi.fn() }))
vi.mock('@/features/customers/hooks/use-customers', () => customers)

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const vehicle = {
  id: 'v1',
  plate: 'ABC-123',
  brand: 'Toyota',
  model: 'Hilux',
  year: 2021,
  customerId: 'c1',
  owner: {
    id: 'c1',
    type: 'NATURAL' as const,
    documentNumber: '20123456789',
    firstName: 'Juan',
    lastName: 'Pérez',
    legalName: null,
  },
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const existingAppointment: Appointment = {
  id: 'a1',
  code: 'CITA-000001',
  customer: {
    id: 'c1',
    documentNumber: '20123456789',
    name: 'Juan Pérez',
  },
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
  status: 'PROGRAMADA',
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

function slotFullError(): AxiosError {
  return new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    {
      data: {
        error: {
          code: 'APPOINTMENT_SLOT_FULL',
          message:
            'El horario seleccionado ya alcanzó su capacidad de 8 citas activas.',
        },
      },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: undefined as never } as never,
    },
  )
}

function renderModal({
  open = true,
  mode = 'create',
  appointment = null,
}: {
  open?: boolean
  mode?: 'create' | 'reschedule'
  appointment?: Appointment | null
} = {}) {
  const onClose = vi.fn()
  render(
    <AppointmentFormModal
      open={open}
      mode={mode}
      appointment={appointment}
      onClose={onClose}
    />,
  )
  return { onClose }
}

function mutationsMock() {
  return {
    create: { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) },
    reschedule: {
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({}),
    },
    cancel: { isPending: false, mutateAsync: vi.fn() },
  }
}

async function fillCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Cliente de la cita' }))
  await user.click(screen.getByRole('option', { name: /Juan Pérez/ }))

  await user.click(screen.getByRole('button', { name: 'Vehículo de la cita' }))
  await user.click(screen.getByRole('option', { name: /ABC-123/ }))

  await user.click(screen.getByRole('button', { name: 'Fecha de la cita' }))
  await user.click(screen.getByRole('button', { name: 'Mes siguiente' }))
  await user.click(screen.getByRole('button', { name: '15' }))

  await user.click(screen.getByRole('button', { name: 'Hora de la cita' }))
  await user.click(screen.getByRole('option', { name: '10:00' }))

  await user.type(
    screen.getByLabelText('Motivo de la cita'),
    'Cambio de aceite',
  )
}

describe('Formulario de citas', () => {
  beforeEach(() => {
    query.useQuery.mockReturnValue({ data: { data: vehiclesData() } })
    customers.useCustomers.mockReturnValue({
      data: {
        data: [
          {
            id: 'c1',
            type: 'NATURAL',
            documentNumber: '20123456789',
            firstName: 'Juan',
            lastName: 'Pérez',
            legalName: null,
            phone: '999888777',
            email: null,
          },
        ],
      },
    })
    appointments.useAppointmentMutations.mockReturnValue(mutationsMock())
  })

  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('registra una cita completa con cliente, vehículo, fecha, hora y motivo', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    appointments.useAppointmentMutations.mockReturnValue(mutations)
    const { onClose } = renderModal()

    await fillCreateForm(user)
    expect(
      screen.getByRole('button', { name: 'Fecha de la cita' }).textContent,
    ).not.toContain('Seleccionar fecha')
    expect(
      screen.getByRole('button', { name: 'Hora de la cita' }).textContent,
    ).toContain('10:00')
    await user.click(screen.getByRole('button', { name: 'Registrar cita' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(mutations.create.mutateAsync).toHaveBeenCalledTimes(1)
    const input = mutations.create.mutateAsync.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >
    expect(input).toMatchObject({
      customerId: 'c1',
      vehicleId: 'v1',
      time: '10:00',
      reason: 'Cambio de aceite',
    })
    expect(input.date).toMatch(/^\d{4}-\d{2}-15$/)
    expect(toast.success).toHaveBeenCalledWith('Cita registrada correctamente.')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('refleja el vehículo elegido después de seleccionar un cliente', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Cliente de la cita' }))
    await user.click(screen.getByRole('option', { name: /Juan Pérez/ }))
    await user.click(
      screen.getByRole('button', { name: 'Vehículo de la cita' }),
    )
    await user.click(screen.getByRole('option', { name: /ABC-123/ }))

    expect(
      screen.getByRole('button', {
        name: /Vehículo de la cita/,
      }).textContent,
    ).toContain('ABC-123')
  })

  it('rechaza el formulario sin seleccionar cliente', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    appointments.useAppointmentMutations.mockReturnValue(mutations)
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Registrar cita' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Selecciona un cliente.'),
    )
    expect(mutations.create.mutateAsync).not.toHaveBeenCalled()
  })

  it('muestra el mensaje de horario completo al crear (capacidad de 8)', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    mutations.create.mutateAsync.mockRejectedValue(slotFullError())
    appointments.useAppointmentMutations.mockReturnValue(mutations)
    const { onClose } = renderModal()

    await fillCreateForm(user)
    await user.click(screen.getByRole('button', { name: 'Registrar cita' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'El horario seleccionado ya alcanzó su capacidad de 8 citas activas.',
      ),
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('precarga fecha y hora al reprogramar una cita existente', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    appointments.useAppointmentMutations.mockReturnValue(mutations)
    const { onClose } = renderModal({
      mode: 'reschedule',
      appointment: existingAppointment,
    })

    expect(
      screen.getByRole('heading', { name: 'Reprogramar cita' }),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(mutations.reschedule.mutateAsync).toHaveBeenCalledWith({
      id: 'a1',
      input: { date: '2099-12-31', time: '10:00' },
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Cita reprogramada correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('permite cambiar la hora al reprogramar', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    appointments.useAppointmentMutations.mockReturnValue(mutations)
    renderModal({ mode: 'reschedule', appointment: existingAppointment })

    await user.click(
      screen.getByRole('button', { name: 'Nueva hora de la cita' }),
    )
    await user.click(screen.getByRole('option', { name: '14:30' }))

    expect(
      screen.getByRole('button', { name: 'Nueva hora de la cita' }).textContent,
    ).toContain('14:30')

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(mutations.reschedule.mutateAsync).toHaveBeenCalledWith({
        id: 'a1',
        input: { date: '2099-12-31', time: '14:30' },
      }),
    )
  })

  it('muestra el mensaje de horario completo al reprogramar', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    mutations.reschedule.mutateAsync.mockRejectedValue(slotFullError())
    appointments.useAppointmentMutations.mockReturnValue(mutations)
    const { onClose } = renderModal({
      mode: 'reschedule',
      appointment: existingAppointment,
    })

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'El horario seleccionado ya alcanzó su capacidad de 8 citas activas.',
      ),
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})

function vehiclesData() {
  return [vehicle]
}
