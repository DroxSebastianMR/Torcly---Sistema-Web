// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PermissionRoute } from './permission-route'
import type { Permission } from '@/lib/permissions'

const auth = vi.hoisted(() => {
  let user: {
    id: string
    name: string
    email: string
    username: string
    permissions: string[]
  } | null = null
  return {
    set(next: typeof user) {
      user = next
    },
    get() {
      return user
    },
  }
})

vi.mock('@/features/auth/hooks/auth-context', () => ({
  useAuth: () => ({ user: auth.get() }),
}))

const mockUser = {
  id: '1',
  name: 'Arian',
  email: 'arian@torcly.dev',
  username: 'arian',
  permissions: ['dashboard:read', 'products:read'],
}

function renderPermissionRoute(permission: Permission) {
  return render(
    <MemoryRouter initialEntries={['/modulo']}>
      <Routes>
        <Route path="/dashboard" element={<p>Panel principal</p>} />
        <Route element={<PermissionRoute permission={permission} />}>
          <Route path="/modulo" element={<p>Módulo usuarios</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('PermissionRoute', () => {
  beforeEach(() => {
    auth.set(null)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('permite el acceso cuando el usuario posee el permiso', () => {
    auth.set(mockUser)

    renderPermissionRoute('products:read')

    expect(screen.getByText('Módulo usuarios')).toBeTruthy()
  })

  it('muestra el estado de acceso restringido sin el permiso', async () => {
    auth.set(mockUser)

    renderPermissionRoute('users:read')

    expect(screen.getByRole('alert').textContent).toContain(
      'Acceso restringido',
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    )
    expect(screen.getByText('Panel principal')).toBeTruthy()
  })

  it('bloquea el acceso cuando no hay usuario autenticado', () => {
    renderPermissionRoute('dashboard:read')

    expect(screen.getByRole('alert').textContent).toContain(
      'Acceso restringido',
    )
  })
})
