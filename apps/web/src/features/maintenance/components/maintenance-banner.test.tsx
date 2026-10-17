// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MaintenanceBanner } from './maintenance-banner'

const maintenance = vi.hoisted(() => ({ useMaintenanceStatus: vi.fn() }))
vi.mock('../hooks/use-maintenance', () => ({
  useMaintenanceStatus: maintenance.useMaintenanceStatus,
}))

function statusResult(window: unknown) {
  return {
    data: { generatedAt: '2026-10-07T00:00:00.000Z', window },
    isLoading: false,
    isError: false,
  }
}

describe('Aviso de mantenimiento', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el mensaje cuando la ventana está en curso', () => {
    maintenance.useMaintenanceStatus.mockReturnValue(
      statusResult({
        id: 'window-1',
        startsAt: '2026-10-20T10:00:00.000Z',
        endsAt: '2026-10-20T12:00:00.000Z',
        message: 'Actualizamos el sistema.',
        status: 'active',
      }),
    )

    render(<MaintenanceBanner />)

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText('Actualizamos el sistema.')).toBeTruthy()
  })

  it('permanece oculto cuando la ventana está programada', () => {
    maintenance.useMaintenanceStatus.mockReturnValue(
      statusResult({
        id: 'window-2',
        startsAt: '2999-01-01T00:00:00.000Z',
        endsAt: '2999-01-01T02:00:00.000Z',
        message: 'Programado.',
        status: 'scheduled',
      }),
    )

    const { container } = render(<MaintenanceBanner />)

    expect(container.innerHTML).toBe('')
  })

  it('permanece oculto sin ventanas', () => {
    maintenance.useMaintenanceStatus.mockReturnValue(statusResult(null))

    const { container } = render(<MaintenanceBanner />)

    expect(container.innerHTML).toBe('')
  })
})
