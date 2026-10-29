// @vitest-environment jsdom

import { AxiosError } from 'axios'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProtectedRoute } from './protected-route'

const auth = vi.hoisted(() => {
  let state: {
    user: {
      id: string
      name: string
      email: string
      username: string
      permissions: string[]
    } | null
    loading: boolean
    error: boolean
    errorDetail?: unknown
  } = { user: null, loading: false, error: false }
  return {
    state,
    set(next: typeof state) {
      state = next
    },
    get() {
      return state
    },
    retry: vi.fn(),
  }
})

vi.mock('@/features/auth/hooks/auth-context', () => ({
  useAuth: () => ({ ...auth.get(), retry: auth.retry }),
}))

const mockUser = {
  id: '1',
  name: 'Arian',
  email: 'arian@torcly.dev',
  username: 'arian',
  permissions: ['dashboard:read'],
}

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/protegido']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protegido" element={<p>Contenido protegido</p>} />
        </Route>
        <Route path="/login" element={<p>Pantalla de inicio de sesión</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    auth.set({ user: null, loading: false, error: false })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra una pantalla de carga mientras se verifica la sesión', () => {
    auth.set({ user: null, loading: true, error: false })

    renderProtected()

    expect(screen.getByText('Verificando tu sesión')).toBeTruthy()
  })

  it('redirige al inicio de sesión cuando no hay sesión válida', () => {
    renderProtected()

    expect(screen.getByText('Pantalla de inicio de sesión')).toBeTruthy()
  })

  it('recupera una sesión afectada por un error de conexión', async () => {
    auth.set({
      user: null,
      loading: false,
      error: true,
      errorDetail: new AxiosError('Network Error', 'ERR_NETWORK'),
    })

    renderProtected()

    expect(screen.getByRole('alert').textContent).toContain(
      'Sin conexión con Torcly',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(auth.retry).toHaveBeenCalledOnce()
  })

  it('muestra un estado genérico ante un fallo inesperado', () => {
    auth.set({
      user: null,
      loading: false,
      error: true,
      errorDetail: new Error('Algo explotó'),
    })

    renderProtected()

    expect(screen.getByRole('alert').textContent).toContain('Algo salió mal')
  })

  it('deja pasar al contenido cuando la sesión es válida', () => {
    auth.set({ user: mockUser, loading: false, error: false })

    renderProtected()

    expect(screen.getByText('Contenido protegido')).toBeTruthy()
  })
})
