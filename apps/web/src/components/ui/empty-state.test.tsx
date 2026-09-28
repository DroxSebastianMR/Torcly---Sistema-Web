// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  afterEach(cleanup)

  it('muestra el título y la descripción de la lista vacía', () => {
    render(
      <EmptyState
        title="No se encontraron resultados"
        description="Ajusta los filtros para continuar."
      />,
    )

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'No se encontraron resultados',
      }),
    ).toBeTruthy()
    expect(screen.getByText('Ajusta los filtros para continuar.')).toBeTruthy()
  })

  it('ejecuta la acción contextual cuando se provee', async () => {
    const user = userEvent.setup()
    const clear = vi.fn()
    render(
      <EmptyState
        title="Sin datos"
        action={{ label: 'Limpiar filtros', onClick: clear }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(clear).toHaveBeenCalledOnce()
  })
})
