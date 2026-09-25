// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

    await user.click(screen.getByRole('button', { name: 'Buscar usuarios' }))
    await user.type(screen.getByPlaceholderText('Buscar opción…'), 'arianbq')

    expect(onChange).toHaveBeenLastCalledWith('arianbq')
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
})
