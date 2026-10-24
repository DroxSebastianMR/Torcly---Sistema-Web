// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Customer } from '../types/customers.types'
import { CustomerFormModal } from './customer-form-modal'

const service = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../services/customers.service', () => ({ customersService: service }))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

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
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function renderModal({
  open = true,
  customer = null,
}: { open?: boolean; customer?: Customer | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <CustomerFormModal open={open} customer={customer} onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('Formulario de clientes', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('valida el formulario de persona natural sin enviar campos vacíos', async () => {
    renderModal()
    await userEvent.type(screen.getByLabelText(/^DNI/i), '123')
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar cliente' }),
    )

    expect(await screen.findByText('El DNI debe tener 8 dígitos.')).toBeTruthy()
    expect(await screen.findByText('Ingresa los nombres.')).toBeTruthy()
    expect(await screen.findByText('Ingresa los apellidos.')).toBeTruthy()
    expect(await screen.findByText('Ingresa un teléfono válido.')).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })

  it('envía el payload correcto al registrar una persona natural', async () => {
    service.create.mockResolvedValue({ data: {} })
    const { onClose } = renderModal()

    await userEvent.type(screen.getByLabelText(/^DNI/i), '12345678')
    await userEvent.type(screen.getByLabelText(/^nombres/i), 'María')
    await userEvent.type(screen.getByLabelText(/^apellidos/i), 'Pérez')
    await userEvent.type(screen.getByLabelText(/teléfono/i), '987654321')
    await userEvent.type(
      screen.getByLabelText(/correo electrónico/i),
      'maria@torcly.local',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar cliente' }),
    )

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        type: 'NATURAL',
        documentNumber: '12345678',
        firstName: 'María',
        lastName: 'Pérez',
        phone: '987654321',
        email: 'maria@torcly.local',
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Cliente registrado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('alterna a persona jurídica y envía el payload correspondiente', async () => {
    service.create.mockResolvedValue({ data: {} })
    const { onClose } = renderModal()

    await userEvent.click(screen.getByLabelText(/tipo de cliente/i))
    await userEvent.click(
      await screen.findByRole('option', { name: 'Persona jurídica' }),
    )
    await userEvent.type(screen.getByLabelText(/^RUC/i), '20123456789')
    await userEvent.type(
      screen.getByLabelText(/razón social/i),
      'Torcly Repuestos S.A.C.',
    )
    await userEvent.type(screen.getByLabelText(/teléfono/i), '+51987654321')
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar cliente' }),
    )

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        type: 'LEGAL',
        documentNumber: '20123456789',
        legalName: 'Torcly Repuestos S.A.C.',
        phone: '+51987654321',
        email: null,
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Cliente registrado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('revalida el RUC al corregirlo después del primer error', async () => {
    renderModal()

    await userEvent.click(screen.getByLabelText(/tipo de cliente/i))
    await userEvent.click(
      await screen.findByRole('option', { name: 'Persona jurídica' }),
    )

    const rucInput = screen.getByLabelText(/^RUC/i)
    await userEvent.type(rucInput, '2012345678')
    await userEvent.type(
      screen.getByLabelText(/razón social/i),
      'Torcly Repuestos S.A.C.',
    )
    await userEvent.type(screen.getByLabelText(/teléfono/i), '+51987654321')
    await userEvent.tab()

    expect(
      await screen.findByText('El RUC debe tener 11 dígitos.'),
    ).toBeTruthy()

    await userEvent.type(rucInput, '9')

    await waitFor(() =>
      expect(screen.queryByText('El RUC debe tener 11 dígitos.')).toBeNull(),
    )
    expect(
      (screen.getByLabelText(/razón social/i) as HTMLInputElement).value,
    ).toBe('Torcly Repuestos S.A.C.')
    expect((screen.getByLabelText(/teléfono/i) as HTMLInputElement).value).toBe(
      '+51987654321',
    )

    await userEvent.clear(rucInput)
    await userEvent.type(rucInput, '123')
    await userEvent.tab()

    expect(
      await screen.findByText('El RUC debe tener 11 dígitos.'),
    ).toBeTruthy()
  })

  it('retira el error de RUC al corregirlo sin perder los demás campos', async () => {
    renderModal()

    await userEvent.click(screen.getByLabelText(/tipo de cliente/i))
    await userEvent.click(
      await screen.findByRole('option', { name: 'Persona jurídica' }),
    )

    const rucInput = screen.getByLabelText(/^RUC/i)
    await userEvent.type(rucInput, '2012345678')
    await userEvent.type(
      screen.getByLabelText(/razón social/i),
      'Torcly Repuestos S.A.C.',
    )
    await userEvent.type(screen.getByLabelText(/teléfono/i), '+51987654321')
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar cliente' }),
    )

    expect(
      await screen.findByText('El RUC debe tener 11 dígitos.'),
    ).toBeTruthy()

    await userEvent.type(rucInput, '9')

    await waitFor(() =>
      expect(screen.queryByText('El RUC debe tener 11 dígitos.')).toBeNull(),
    )
    expect(
      (screen.getByLabelText(/razón social/i) as HTMLInputElement).value,
    ).toBe('Torcly Repuestos S.A.C.')
    expect((screen.getByLabelText(/teléfono/i) as HTMLInputElement).value).toBe(
      '+51987654321',
    )

    await userEvent.clear(rucInput)
    await userEvent.type(rucInput, '123')

    expect(
      await screen.findByText('El RUC debe tener 11 dígitos.'),
    ).toBeTruthy()
  })

  it('precarga la ficha y envía la actualización', async () => {
    service.update.mockResolvedValue({ data: {} })
    const { onClose } = renderModal({ customer: existingCustomer })

    expect((screen.getByLabelText(/^DNI/i) as HTMLInputElement).value).toBe(
      '12345678',
    )
    const phoneInput = screen.getByLabelText(/teléfono/i)
    await userEvent.clear(phoneInput)
    await userEvent.type(phoneInput, '912345678')
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    )

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith('c1', {
        type: 'NATURAL',
        documentNumber: '12345678',
        firstName: 'María',
        lastName: 'Pérez',
        phone: '912345678',
        email: 'maria@torcly.local',
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Cliente actualizado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
