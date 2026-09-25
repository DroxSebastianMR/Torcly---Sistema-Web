// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../types/users.types'
import { UserFormModal } from './user-form-modal'

const service = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  role: vi.fn(),
  status: vi.fn(),
  list: vi.fn(),
  roles: vi.fn(),
}))

vi.mock('../services/users.service', () => ({ usersService: service }))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const roleId = '3f0d0d5a-2b8a-4c19-9d3e-4f1b2c3d4e5f'
const roles = [
  { id: roleId, code: 'admin', name: 'Administrador', permissions: [] },
]

const existingUser: User = {
  id: 'u1',
  username: 'jperez',
  email: 'jperez@torcly.local',
  displayName: 'Juan Pérez',
  active: true,
  roleIds: [roleId],
  permissions: ['users:read'],
  roles: [
    { id: roleId, code: 'admin', name: 'Administrador', permissions: [] },
  ],
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function renderModal({
  open = true,
  user = null,
}: { open?: boolean; user?: User | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <UserFormModal open={open} user={user} roles={roles} onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('Formulario de usuarios', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('valida el formulario de creación sin enviar campos vacíos', async () => {
    renderModal()
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar usuario' }),
    )

    expect(
      await screen.findByText(
        'El nombre de usuario debe tener al menos 3 caracteres.',
      ),
    ).toBeTruthy()
    expect(
      await screen.findByText('Ingresa un correo electrónico válido.'),
    ).toBeTruthy()
    expect(await screen.findByText('Selecciona un rol.')).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })

  it('envía el payload correcto al crear un usuario', async () => {
    service.create.mockResolvedValue({ data: {} })
    const { onClose } = renderModal()

    await userEvent.type(screen.getByLabelText(/nombre de usuario/i), 'jperez')
    await userEvent.type(screen.getByLabelText(/nombre visible/i), 'Juan Pérez')
    await userEvent.type(
      screen.getByLabelText(/correo electrónico/i),
      'jperez@torcly.local',
    )
    await userEvent.type(
      screen.getByLabelText(/contraseña inicial/i),
      'Clave-segura-123',
    )
    await userEvent.click(screen.getByLabelText(/rol/i))
    await userEvent.click(
      await screen.findByRole('option', { name: 'Administrador' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar usuario' }),
    )

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        username: 'jperez',
        email: 'jperez@torcly.local',
        displayName: 'Juan Pérez',
        password: 'Clave-segura-123',
        roleId,
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Usuario registrado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('precarga los datos y envía la actualización de perfil', async () => {
    service.update.mockResolvedValue({ data: {} })
    const { onClose } = renderModal({ user: existingUser })

    const nameInput = screen.getByLabelText(/nombre visible/i)
    expect((nameInput as HTMLInputElement).value).toBe('Juan Pérez')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Juan Pérez Actualizado')
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar cambios' }),
    )

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith('u1', {
        email: 'jperez@torcly.local',
        displayName: 'Juan Pérez Actualizado',
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Usuario actualizado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
