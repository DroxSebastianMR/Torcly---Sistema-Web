// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VehicleFormModal } from './vehicle-form-modal'
import type { Vehicle } from '../types/vehicles.types'

const service = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../services/vehicles.service', () => ({ vehiclesService: service }))

const owners = vi.hoisted(() => ({ useVehicleOwnerOptions: vi.fn() }))
vi.mock('../hooks/use-vehicle-owner-options', () => ({
  useVehicleOwnerOptions: owners.useVehicleOwnerOptions,
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const ownerOptions = [
  { value: 'c1', label: 'María Pérez · 12345678' },
  { value: 'c2', label: 'Torcly Repuestos S.A.C. · 20123456789' },
]

const existingVehicle: Vehicle = {
  id: 'v1',
  plate: 'ABC123',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2021,
  customerId: 'c1',
  owner: {
    id: 'c1',
    type: 'NATURAL',
    documentNumber: '12345678',
    firstName: 'María',
    lastName: 'Pérez',
    legalName: null,
  },
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function renderModal({
  open = true,
  vehicle = null,
}: { open?: boolean; vehicle?: Vehicle | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onClose = vi.fn()
  owners.useVehicleOwnerOptions.mockReturnValue({
    options: ownerOptions,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  })
  render(
    <QueryClientProvider client={client}>
      <VehicleFormModal open={open} vehicle={vehicle} onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('Formulario de vehículos', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('valida el formulario sin enviar campos vacíos', async () => {
    renderModal()
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar vehículo' }),
    )

    expect(
      await screen.findByText('La placa debe tener 5 a 8 letras y números.'),
    ).toBeTruthy()
    expect(await screen.findByText('Ingresa la marca.')).toBeTruthy()
    expect(await screen.findByText('Ingresa el modelo.')).toBeTruthy()
    expect(await screen.findByText('Ingresa el año.')).toBeTruthy()
    expect(await screen.findByText('Selecciona el propietario.')).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })

  it('normaliza la placa y envía el payload correcto al registrar', async () => {
    service.create.mockResolvedValue({ data: {} })
    const { onClose } = renderModal()

    await userEvent.type(screen.getByLabelText(/^placa/i), 'abc-123')
    await userEvent.type(screen.getByLabelText(/^marca/i), 'Toyota')
    await userEvent.type(screen.getByLabelText(/^modelo/i), 'Corolla')
    await userEvent.type(screen.getByLabelText(/^año/i), '2021')
    await userEvent.click(
      screen.getByRole('button', { name: 'Propietario del vehículo' }),
    )
    await userEvent.click(
      await screen.findByRole('option', { name: 'María Pérez · 12345678' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar vehículo' }),
    )

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        plate: 'ABC123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        customerId: 'c1',
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Vehículo registrado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('precarga la ficha, bloquea al propietario y actualiza sin enviarlo', async () => {
    service.update.mockResolvedValue({ data: {} })
    const { onClose } = renderModal({ vehicle: existingVehicle })

    expect((screen.getByLabelText(/^placa/i) as HTMLInputElement).value).toBe(
      'ABC123',
    )
    expect(
      (
        screen.getByRole('button', {
          name: 'Propietario del vehículo',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)

    const brandInput = screen.getByLabelText(/^marca/i)
    await userEvent.clear(brandInput)
    await userEvent.type(brandInput, 'Hyundai')
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    )

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith('v1', {
        plate: 'ABC123',
        brand: 'Hyundai',
        model: 'Corolla',
        year: 2021,
      }),
    )
    expect(service.update).toHaveBeenCalledWith(
      'v1',
      expect.not.objectContaining({ customerId: expect.anything() }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Vehículo actualizado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('rechaza un año fuera del rango documentado', async () => {
    renderModal()
    await userEvent.type(screen.getByLabelText(/^placa/i), 'ABC123')
    await userEvent.type(screen.getByLabelText(/^marca/i), 'Toyota')
    await userEvent.type(screen.getByLabelText(/^modelo/i), 'Corolla')
    await userEvent.type(screen.getByLabelText(/^año/i), '1800')
    await userEvent.click(
      screen.getByRole('button', { name: 'Propietario del vehículo' }),
    )
    await userEvent.click(
      await screen.findByRole('option', { name: 'María Pérez · 12345678' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar vehículo' }),
    )

    expect(await screen.findByText(/El año debe estar entre/)).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })
})
