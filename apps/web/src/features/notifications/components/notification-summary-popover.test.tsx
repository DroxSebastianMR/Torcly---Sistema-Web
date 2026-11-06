// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { NotificationSummaryPopover } from './notification-summary-popover'
import * as useNotificationsModule from '../hooks/use-notifications'

vi.mock('../hooks/use-notifications', () => ({
  useNotifications: vi.fn(),
  useNotificationMutations: vi.fn(() => ({
    markAsRead: { mutateAsync: vi.fn() },
    markAllAsRead: { mutateAsync: vi.fn(), isPending: false },
  })),
}))

describe('NotificationSummaryPopover', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renderiza la campana con el badge numérico de no leídas', () => {
    vi.mocked(useNotificationsModule.useNotifications).mockReturnValue({
      data: { data: [] },
      isPending: false,
      isError: false,
    } as any)

    render(
      <BrowserRouter>
        <NotificationSummaryPopover count={5} path="/notificaciones" />
      </BrowserRouter>,
    )

    const button = screen.getByRole('button', {
      name: /Notificaciones \(5 sin leer\)/i,
    })
    expect(button).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('despliega el resumen de notificaciones al hacer clic', () => {
    vi.mocked(useNotificationsModule.useNotifications).mockReturnValue({
      data: {
        data: [
          {
            id: 'notif-1',
            title: 'Orden de trabajo lista',
            message: 'El vehículo está listo para entrega.',
            type: 'WORK_ORDER_READY',
            link: '/ordenes-taller',
            read: false,
            createdAt: '2026-11-05T12:00:00Z',
          },
        ],
      },
      isPending: false,
      isError: false,
    } as any)

    render(
      <BrowserRouter>
        <NotificationSummaryPopover count={1} path="/notificaciones" />
      </BrowserRouter>,
    )

    const button = screen.getByRole('button', {
      name: /Notificaciones \(1 sin leer\)/i,
    })
    fireEvent.click(button)

    expect(
      screen.getByRole('dialog', { name: /Resumen de notificaciones/i }),
    ).toBeTruthy()
    expect(screen.getByText('Orden de trabajo lista')).toBeTruthy()
    expect(
      screen.getByText('El vehículo está listo para entrega.'),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Ver todas/i }).getAttribute('href'),
    ).toBe('/notificaciones')
  })
})
