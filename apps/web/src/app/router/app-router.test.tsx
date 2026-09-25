// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { RouteError } from './app-router'

function renderError(initialPath: string) {
  const routes: RouteObject[] = [
    {
      errorElement: <RouteError />,
      children: [
        { path: '/dashboard', element: <p>Panel principal</p> },
        {
          path: '/recurso',
          loader: () => {
            throw new Response('No existe', { status: 404 })
          },
        },
        {
          path: '/falla',
          loader: () => {
            throw new Response('Falló', { status: 500 })
          },
        },
      ],
    },
  ]
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  return render(<RouterProvider router={router} />)
}

describe('RouteError', () => {
  afterEach(cleanup)

  it('muestra una página no encontrada con salida al inicio para errores 404', async () => {
    renderError('/recurso')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Página no encontrada')

    await userEvent.click(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    )
    expect(await screen.findByText('Panel principal')).toBeTruthy()
  })

  it('muestra un estado inesperado con reintento para errores internos', async () => {
    renderError('/falla')

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Algo salió mal')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    ).toBeTruthy()
  })
})
