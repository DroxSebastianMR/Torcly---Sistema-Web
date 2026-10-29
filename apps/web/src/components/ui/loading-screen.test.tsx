// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LoadingScreen } from './loading-screen'

describe('LoadingScreen', () => {
  afterEach(cleanup)

  it('expone un estado de carga accesible con mensajes predeterminados', () => {
    render(<LoadingScreen />)

    const status = screen.getByRole('status')
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Preparando tu espacio')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('permite personalizar el contexto de la carga', () => {
    render(
      <LoadingScreen
        title="Verificando tu sesión"
        description="Estamos validando tu acceso seguro."
      />,
    )

    expect(screen.getByText('Verificando tu sesión')).toBeTruthy()
    expect(screen.getByText('Estamos validando tu acceso seguro.')).toBeTruthy()
  })
})
