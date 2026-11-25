// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SmartSelect } from './smart-select'

const smallOptions = [
  { value: 'a', label: 'Almacén' },
  { value: 'b', label: 'Boutique' },
]
const largeOptions = Array.from({ length: 11 }, (_, index) => ({
  value: String(index),
  label: `Categoría ${index + 1}`,
}))

describe('SmartSelect', () => {
  afterEach(() => {
    cleanup()
  })

  it('usa el selector visual de Torcly sin búsqueda hasta diez opciones', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SmartSelect
        options={smallOptions}
        value=""
        onChange={onChange}
        aria-label="Sucursal"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Sucursal' }))
    expect(screen.queryByPlaceholderText('Buscar opción…')).toBeNull()
    expect(screen.getByRole('option', { name: 'Almacén' })).toBeTruthy()
    await user.click(screen.getByRole('option', { name: 'Boutique' }))

    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('muestra búsqueda y filtra cuando hay más de diez opciones', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SmartSelect
        options={largeOptions}
        value=""
        onChange={onChange}
        aria-label="Categoría"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Categoría' }))
    await user.type(screen.getByPlaceholderText('Buscar opción…'), '11')
    await user.click(screen.getByRole('option', { name: 'Categoría 11' }))

    expect(onChange).toHaveBeenCalledWith('10')
  })

  it.each(['valvula co', 'VÁLVULA-CO', 'iac0102'])(
    'encuentra el producto con %s y conserva su ID',
    async (query) => {
      const user = userEvent.setup()
      const change = vi.fn()
      render(
        <SmartSelect
          forceSearch
          options={[
            { value: 'p1', label: 'Válvula CO', searchTerms: ['IAC-01/02'] },
            { value: 'p2', label: 'Bobina' },
          ]}
          value=""
          onChange={change}
          aria-label="Producto"
        />,
      )
      await user.click(screen.getByRole('button', { name: 'Producto' }))
      await user.type(screen.getByPlaceholderText('Buscar opción…'), query)
      expect(screen.queryByRole('option', { name: 'Bobina' })).toBeNull()
      await user.click(screen.getByRole('option', { name: 'Válvula CO' }))
      expect(change).toHaveBeenCalledWith('p1')
    },
  )

  it('acepta búsqueda libre cuando se usa como combobox de filtros', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SmartSelect
        options={smallOptions}
        value=""
        onChange={onChange}
        forceSearch
        allowCustomValue
        aria-label="Buscar usuarios"
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Buscar usuarios' })
    await user.click(trigger)
    await user.type(screen.getByPlaceholderText('Buscar opción…'), 'arianbq')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenLastCalledWith('arianbq')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('muestra las sugerencias que devuelve el servidor aunque la búsqueda tenga otra escritura', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <SmartSelect
        options={[]}
        value=""
        onChange={vi.fn()}
        forceSearch
        allowCustomValue
        aria-label="Buscar productos"
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Buscar productos' }))
    await user.type(screen.getByPlaceholderText('Buscar opción…'), 'valvula')
    rerender(
      <SmartSelect
        options={[{ value: 'IAC-01', label: 'Válvula IAC · Aktion' }]}
        value="valvula"
        onChange={vi.fn()}
        forceSearch
        allowCustomValue
        aria-label="Buscar productos"
      />,
    )
    expect(
      screen.getByRole('option', { name: 'Válvula IAC · Aktion' }),
    ).toBeTruthy()
  })

  it('permite limpiar una búsqueda con el botón del campo', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SmartSelect
        options={smallOptions}
        value=""
        onChange={onChange}
        forceSearch
        allowCustomValue
        aria-label="Buscar usuarios"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Buscar usuarios' }))
    const search = screen.getByPlaceholderText('Buscar opción…')
    await user.type(search, 'arian')
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    expect((search as HTMLInputElement).value).toBe('')
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(document.activeElement).toBe(search)
  })

  it('permite definir el criterio de coincidencia de cada módulo', async () => {
    const user = userEvent.setup()
    render(
      <SmartSelect
        options={[
          { value: '90009251', label: 'Cliente natural' },
          { value: '20900092511', label: 'Cliente jurídico' },
        ]}
        value=""
        onChange={vi.fn()}
        forceSearch
        filterOption={(option, query) => option.value === query}
        aria-label="Buscar clientes"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Buscar clientes' }))
    await user.type(screen.getByPlaceholderText('Buscar opción…'), '90009251')

    expect(screen.getByRole('option', { name: 'Cliente natural' })).toBeTruthy()
    expect(
      screen.queryByRole('option', { name: 'Cliente jurídico' }),
    ).toBeNull()
  })

  it('cierra con Escape y devuelve el foco al disparador', async () => {
    const user = userEvent.setup()
    render(
      <SmartSelect
        options={smallOptions}
        value=""
        onChange={vi.fn()}
        aria-label="Sucursal"
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Sucursal' })
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    await user.keyboard('{Escape}')

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('option', { name: 'Almacén' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('devuelve el foco al disparador tras seleccionar una opción', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <SmartSelect
        options={smallOptions}
        value=""
        onChange={onChange}
        aria-label="Sucursal"
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Sucursal' })
    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Boutique' }))

    expect(onChange).toHaveBeenCalledWith('b')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })
})
