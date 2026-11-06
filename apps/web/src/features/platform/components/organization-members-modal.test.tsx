// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OrganizationMembersModal } from './organization-members-modal'
import type {
  PlatformOrganization,
  PlatformOrganizationMember,
  PlatformRole,
} from '../types/platform.types'

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock('sonner', () => ({ toast }))

const mockOrganization: PlatformOrganization = {
  id: 'org-1',
  code: 'ORG001',
  name: 'Taller Central',
  active: true,
  owner: {
    id: 'user-1',
    displayName: 'Arian Bautista',
    email: 'arian@example.com',
    role: { id: 'role-1', code: 'OWNER', name: 'Dueño del taller' },
  },
  memberCount: 2,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
}

const mockRoles: PlatformRole[] = [
  { id: 'role-1', code: 'OWNER', name: 'Dueño del taller' },
]

const mockMembers: PlatformOrganizationMember[] = [
  {
    id: 'user-1',
    username: 'arian',
    displayName: 'Arian Bautista',
    email: 'arian@example.com',
    active: true,
    joinedAt: '2026-11-01T00:00:00.000Z',
    role: { id: 'role-1', code: 'OWNER', name: 'Dueño del taller' },
  },
  {
    id: 'user-2',
    username: 'juanito',
    displayName: 'Juanito Perez',
    email: 'juanito@example.com',
    active: true,
    joinedAt: '2026-11-02T00:00:00.000Z',
    role: { id: 'role-1', code: 'OWNER', name: 'Dueño del taller' },
  },
]

describe('OrganizationMembersModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra la clave temporal debajo del usuario seleccionado con temporizador de 60s', async () => {
    const onResetPassword = vi.fn().mockResolvedValue({
      temporaryPassword: 'Torcly-TEST-1234!',
    })

    render(
      <OrganizationMembersModal
        organization={mockOrganization}
        roles={mockRoles}
        members={mockMembers}
        loading={false}
        busy={false}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onResetPassword={onResetPassword}
      />,
    )

    expect(screen.getByText('Arian Bautista')).toBeTruthy()
    expect(screen.getByText('Juanito Perez')).toBeTruthy()

    const claveButtons = screen.getAllByRole('button', { name: /clave/i })
    expect(claveButtons).toHaveLength(2)

    // Click on reset password for Juanito Perez (second button)
    await userEvent.click(claveButtons[1]!, {
      advanceTimers: vi.advanceTimersByTime,
    })

    await waitFor(() => {
      expect(onResetPassword).toHaveBeenCalledWith('user-2')
      expect(
        screen.getByText(/Clave temporal emitida para Juanito Perez:/i),
      ).toBeTruthy()
      expect(screen.getByText('Torcly-TEST-1234!')).toBeTruthy()
      expect(screen.getByText(/Expira en 60s/i)).toBeTruthy()
    })

    // Advance 5 seconds
    vi.advanceTimersByTime(5000)
    await waitFor(() => {
      expect(screen.getByText(/Expira en 55s/i)).toBeTruthy()
    })

    // Advance past expiration (total 60s)
    vi.advanceTimersByTime(56000)
    await waitFor(() => {
      expect(
        screen.queryByText(/Clave temporal emitida para Juanito Perez:/i),
      ).toBeNull()
      expect(toast.info).toHaveBeenCalledWith(
        'La clave temporal ha expirado por seguridad.',
      )
    })
  })

  it('permite cerrar manualmente el bloque de clave temporal', async () => {
    const onResetPassword = vi.fn().mockResolvedValue({
      temporaryPassword: 'Torcly-TEST-9999!',
    })

    render(
      <OrganizationMembersModal
        organization={mockOrganization}
        roles={mockRoles}
        members={mockMembers}
        loading={false}
        busy={false}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onResetPassword={onResetPassword}
      />,
    )

    const claveButtons = screen.getAllByRole('button', { name: /clave/i })
    await userEvent.click(claveButtons[0]!, {
      advanceTimers: vi.advanceTimersByTime,
    })

    await waitFor(() => {
      expect(screen.getByText('Torcly-TEST-9999!')).toBeTruthy()
    })

    const closeKeyBtn = screen.getByRole('button', {
      name: /cerrar clave temporal/i,
    })
    await userEvent.click(closeKeyBtn, {
      advanceTimers: vi.advanceTimersByTime,
    })

    await waitFor(() => {
      expect(screen.queryByText('Torcly-TEST-9999!')).toBeNull()
    })
  })
})
