// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServiceFormModal } from './service-form-modal'
import type { Service } from '../types/services.types'

const mutations = vi.hoisted(() => ({
  create: { isPending: false, mutateAsync: vi.fn() },
  update: { isPending: false, mutateAsync: vi.fn() },
  status: { isPending: false, mutateAsync: vi.fn() },
}))

vi.mock('../hooks/use-services', () => ({
  useServiceMutations: () => mutations,
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const existingService: Service = {
  id: 'sv1',
  code: 'CAMBIO-BOMBA',
  name: 'Cambio de bomba de agua',
  description: null,
  price: 250.5,
  active: true,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function renderModal({
  open = true,
  service = null,
}: { open?: boolean; service?: Service | null } = {}) {
  const onClose = vi.fn()
  render(<ServiceFormModal open={open} service={service} onClose={onClose} />)
  return { onClose }
}

describe('Formulario de servicios', () => {
  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('valida el formulario sin enviar campos vacíos', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Guardar servicio' }))

    expect(await screen.findByText(/Ingresa un código válido/)).toBeTruthy()
    expect(
      await screen.findByText('Ingresa el nombre del servicio.'),
    ).toBeTruthy()
    expect(mutations.create.mutateAsync).not.toHaveBeenCalled()
  })

  it('rechaza un precio negativo', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.type(
      screen.getByLabelText(/^código del servicio/i),
      'CAMBIO-BOMBA',
    )
    await user.type(
      screen.getByLabelText(/^nombre del servicio/i),
      'Cambio de bomba',
    )
    fireEvent.change(screen.getByLabelText(/^precio/i), {
      target: { value: '-5' },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar servicio' }))

    expect(
      await screen.findByText('El precio no puede ser negativo.'),
    ).toBeTruthy()
    expect(mutations.create.mutateAsync).not.toHaveBeenCalled()
  })

  it('normaliza el código y envía el payload correcto al registrar', async () => {
    const user = userEvent.setup()
    mutations.create.mutateAsync.mockResolvedValue({ data: {} })
    const { onClose } = renderModal()

    await user.type(
      screen.getByLabelText(/^código del servicio/i),
      'cambio-bomba',
    )
    await user.type(
      screen.getByLabelText(/^nombre del servicio/i),
      'Cambio de bomba de agua',
    )
    await user.type(screen.getByLabelText(/^precio/i), '250.5')
    await user.click(screen.getByRole('button', { name: 'Guardar servicio' }))

    await waitFor(() =>
      expect(mutations.create.mutateAsync).toHaveBeenCalledWith({
        code: 'CAMBIO-BOMBA',
        name: 'Cambio de bomba de agua',
        description: null,
        price: 250.5,
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Servicio registrado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('el Enter en el código no envía el formulario', async () => {
    const user = userEvent.setup()
    mutations.create.mutateAsync.mockResolvedValue({ data: {} })
    renderModal()

    const codeInput = screen.getByLabelText(/^código del servicio/i)
    await user.type(codeInput, 'cambio-bomba')
    await user.keyboard('{Enter}')

    expect((codeInput as HTMLInputElement).value).toBe('cambio-bomba')
    expect(mutations.create.mutateAsync).not.toHaveBeenCalled()
  })

  it('precarga la ficha, muestra la tarifa vigente y actualiza', async () => {
    const user = userEvent.setup()
    mutations.update.mutateAsync.mockResolvedValue({ data: {} })
    const { onClose } = renderModal({ service: existingService })

    expect(
      (screen.getByLabelText(/^código del servicio/i) as HTMLInputElement)
        .value,
    ).toBe('CAMBIO-BOMBA')
    expect(screen.getByText('Tarifa vigente')).toBeTruthy()

    const nameInput = screen.getByLabelText(/^nombre del servicio/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Cambio de bomba premium')
    await user.click(screen.getByRole('button', { name: 'Guardar servicio' }))

    await waitFor(() =>
      expect(mutations.update.mutateAsync).toHaveBeenCalledWith({
        id: 'sv1',
        input: expect.objectContaining({
          code: 'CAMBIO-BOMBA',
          name: 'Cambio de bomba premium',
          price: 250.5,
        }),
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Servicio actualizado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
