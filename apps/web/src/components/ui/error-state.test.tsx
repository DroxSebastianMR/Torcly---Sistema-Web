// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorState } from './error-state'

describe('ErrorState', () => {
  afterEach(cleanup)

  it('renderiza la alerta con título, descripción y acción de reintento', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    render(
      <ErrorState
        title="No se pudo cargar los datos"
        description="Verifica la conexión e inténtalo nuevamente."
        action={{ label: 'Reintentar', onClick: retry }}
      />,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('No se pudo cargar los datos')).toBeTruthy()
    expect(
      screen.getByText('Verifica la conexión e inténtalo nuevamente.'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('desactiva el botón y marca la alerta ocupada durante el reintento', () => {
    render(
      <ErrorState
        busy
        title="Error"
        action={{ label: 'Reintentar', onClick: vi.fn() }}
      />,
    )

    const retryButton = screen.getByRole('button', {
      name: 'Reintentar',
    }) as HTMLButtonElement
    expect(retryButton.disabled).toBe(true)
    expect(screen.getByRole('alert').getAttribute('aria-busy')).toBe('true')
  })
})
