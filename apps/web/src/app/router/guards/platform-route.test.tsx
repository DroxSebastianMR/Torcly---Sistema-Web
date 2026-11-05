// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlatformRoute } from './platform-route'

const auth = vi.hoisted(() => {
  let user: { isPlatformAdmin?: boolean } | null = null

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

function renderPlatformRoute() {
  return render(
    <MemoryRouter initialEntries={['/plataforma']}>
      <Routes>
        <Route path="/dashboard" element={<p>Panel del taller</p>} />
        <Route element={<PlatformRoute />}>
          <Route path="/plataforma" element={<p>Panel de plataforma</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('PlatformRoute', () => {
  afterEach(() => {
    auth.set(null)
    cleanup()
  })

  it('permite el acceso a una cuenta de plataforma', () => {
    auth.set({ isPlatformAdmin: true })

    renderPlatformRoute()

    expect(screen.getByText('Panel de plataforma')).toBeTruthy()
  })

  it('redirige una cuenta de taller al panel operativo', () => {
    auth.set({ isPlatformAdmin: false })

    renderPlatformRoute()

    expect(screen.getByText('Panel del taller')).toBeTruthy()
  })
})
