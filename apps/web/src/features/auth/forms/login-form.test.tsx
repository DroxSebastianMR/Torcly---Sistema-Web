// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '@/features/auth/hooks/auth-context'
import type { AuthContextValue } from '@/features/auth/hooks/auth-context'
import { LoginForm } from './login-form'

const toastError = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({ toast: { error: toastError } }))

function renderForm(
  login: AuthContextValue['login'],
  initialEntry: string | { pathname: string; state?: unknown } = '/login',
) {
  const context: AuthContextValue = {
    user: null,
    loading: false,
    error: false,
    retry: vi.fn(),
    login,
    logout: vi.fn(),
  }

  return render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<p>Panel principal</p>} />
          <Route path="/products" element={<p>Catálogo de productos</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('Formulario de acceso', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra validaciones sin enviar credenciales vacías', async () => {
    const login = vi.fn()
    renderForm(login)

    await userEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    )

    expect(
      await screen.findByText('Ingresa tu usuario o correo electrónico'),
    ).toBeTruthy()
    expect(await screen.findByText('Ingresa tu contraseña')).toBeTruthy()
    expect(login).not.toHaveBeenCalled()
  })

  it('envía identifier y vuelve a la ruta protegida solicitada', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    renderForm(login, { pathname: '/login', state: { from: '/products' } })

    await userEvent.type(
      screen.getByLabelText(/usuario o correo electrónico/i),
      'administrador',
    )
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave-segura')
    await userEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    )

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        identifier: 'administrador',
        password: 'Clave-segura',
      }),
    )
    expect(await screen.findByText('Catálogo de productos')).toBeTruthy()
  })

  it('mantiene el formulario y presenta un error genérico cuando falla', async () => {
    const login = vi.fn().mockRejectedValue(new Error('401'))
    renderForm(login)

    await userEvent.type(
      screen.getByLabelText(/usuario o correo electrónico/i),
      'administrador',
    )
    await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await userEvent.click(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    )

    await waitFor(() => expect(toastError).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy()
  })
})
