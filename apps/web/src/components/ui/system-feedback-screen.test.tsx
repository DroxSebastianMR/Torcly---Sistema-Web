// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SystemFeedbackScreen } from './system-feedback-screen'

describe('SystemFeedbackScreen', () => {
  afterEach(cleanup)

  it('expone un estado de alerta con los mensajes del tipo por defecto', () => {
    render(<SystemFeedbackScreen />)

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Algo salió mal' }),
    ).toBeTruthy()
  })

  it.each([
    ['connection', 'Sin conexión con Torcly'],
    ['session-expired', 'Tu sesión venció'],
    ['permission-denied', 'Acceso restringido'],
    ['not-found', 'Página no encontrada'],
    ['unexpected', 'Algo salió mal'],
  ] as const)('muestra la copia semántica para el tipo %s', (kind, title) => {
    render(<SystemFeedbackScreen kind={kind} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title)
    expect(screen.getByRole('alert').textContent).toMatch(
      /no pudimos|venció|permiso|no existe|inesperado/i,
    )
  })

  it('permite sobrescribir título, descripción e ícono', () => {
    render(
      <SystemFeedbackScreen
        kind="connection"
        title="Título personalizado"
        description="Descripción personalizada."
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Título personalizado' }),
    ).toBeTruthy()
    expect(screen.getByText('Descripción personalizada.')).toBeTruthy()
  })

  it('ejecuta la acción principal y la secundaria', async () => {
    const user = userEvent.setup()
    const primary = vi.fn()
    const secondary = vi.fn()
    render(
      <SystemFeedbackScreen
        primaryAction={{ label: 'Reintentar', onClick: primary }}
        secondaryAction={{ label: 'Volver al inicio', onClick: secondary }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(primary).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Volver al inicio' }))
    expect(secondary).toHaveBeenCalledOnce()
  })

  it('desactiva la acción principal y muestra el estado de carga durante un reintento', () => {
    render(
      <SystemFeedbackScreen
        busy
        primaryAction={{ label: 'Reintentar', onClick: vi.fn() }}
      />,
    )

    const retryButton = screen.getByRole('button', {
      name: 'Reintentar',
    }) as HTMLButtonElement
    expect(retryButton.disabled).toBe(true)
    expect(screen.getByRole('alert').getAttribute('aria-busy')).toBe('true')
  })
})
