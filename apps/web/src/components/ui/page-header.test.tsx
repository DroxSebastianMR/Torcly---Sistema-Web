// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PageHeader } from './page-header'

describe('PageHeader', () => {
  afterEach(cleanup)

  it('renderiza título, descripción y eyebrow correctamente', () => {
    render(
      <PageHeader
        eyebrow="Catálogo de clientes"
        title="Clientes"
        description="Gestión integral de clientes y unidades vehiculares."
      />,
    )

    expect(screen.getByText('Catálogo de clientes')).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Clientes' }),
    ).toBeTruthy()
    expect(
      screen.getByText('Gestión integral de clientes y unidades vehiculares.'),
    ).toBeTruthy()
  })

  it('renderiza botones o contenido en el slot de acciones (children)', () => {
    render(
      <PageHeader title="Vehículos">
        <button type="button">Registrar vehículo</button>
      </PageHeader>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Vehículos' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Registrar vehículo' }),
    ).toBeTruthy()
  })
})
