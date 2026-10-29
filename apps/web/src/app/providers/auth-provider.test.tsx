// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { AuthProvider } from './auth-provider'

const service = vi.hoisted(() => ({
  me: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: service,
}))

const authenticatedUser = {
  id: '70c3d238-3fd5-42c7-9a3e-d1eea534899e',
  name: 'Administrador',
  email: 'admin@torcly.local',
  username: 'admin',
  permissions: ['dashboard:read' as const],
}

function SessionProbe() {
  const { user, loading, login, logout } = useAuth()
  if (loading) return <p>Cargando</p>
  return (
    <div>
      <p>{user?.username ?? 'invitado'}</p>
      <button
        type="button"
        onClick={() =>
          void login({ identifier: 'admin', password: 'Clave-segura' })
        }
      >
        Acceder
      </button>
      <button type="button" onClick={() => void logout()}>
        Salir
      </button>
    </div>
  )
}

function renderProvider() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('Proveedor de autenticación', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('restaura una sesión existente mediante me', async () => {
    service.me.mockResolvedValue(authenticatedUser)
    renderProvider()

    expect(await screen.findByText('admin')).toBeTruthy()
    expect(service.me).toHaveBeenCalledOnce()
  })

  it('conserva la sesión en caché al iniciar y la elimina al salir', async () => {
    service.me.mockResolvedValue(null)
    service.login.mockResolvedValue(authenticatedUser)
    service.logout.mockResolvedValue(undefined)
    renderProvider()

    expect(await screen.findByText('invitado')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Acceder' }))
    expect(await screen.findByText('admin')).toBeTruthy()
    expect(service.login).toHaveBeenCalledWith({
      identifier: 'admin',
      password: 'Clave-segura',
    })

    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByText('invitado')).toBeTruthy()
    expect(service.logout).toHaveBeenCalledOnce()
  })
})
