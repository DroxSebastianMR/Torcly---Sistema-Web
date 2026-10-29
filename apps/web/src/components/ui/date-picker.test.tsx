// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from './date-picker'

describe('DatePicker', () => {
  it('abre el calendario y entrega la fecha elegida en formato ISO', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DatePicker
        value="2026-09-10"
        onChange={onChange}
        aria-label="Fecha de venta"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Fecha de venta' }))
    await user.click(screen.getByRole('button', { name: '15' }))

    expect(onChange).toHaveBeenCalledWith('2026-09-15')
  })
})
