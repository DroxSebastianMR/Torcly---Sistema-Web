// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MultiSelect } from './multi-select'

describe('MultiSelect', () => {
  it('mantiene un borrador y aplica varias opciones de una vez', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MultiSelect
        value={[]}
        onChange={onChange}
        aria-label="Roles"
        options={[
          { value: 'admin', label: 'Administrador' },
          { value: 'seller', label: 'Vendedor' },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Roles' }))
    await user.click(screen.getByRole('option', { name: 'Administrador' }))
    await user.click(screen.getByRole('option', { name: 'Vendedor' }))
    await user.click(screen.getByRole('button', { name: 'Aplicar (2)' }))

    expect(onChange).toHaveBeenCalledWith(['admin', 'seller'])
  })
})
