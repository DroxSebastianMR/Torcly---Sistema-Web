// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateRangePicker } from './date-range-picker'

describe('DateRangePicker', () => {
  it('aplica un periodo rápido como rango ISO', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DateRangePicker
        value={{ from: '', to: '' }}
        onChange={onChange}
        aria-label="Periodo"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Periodo' }))
    await user.click(screen.getByRole('button', { name: 'Este mes' }))

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringMatching(/^\d{4}-\d{2}-01$/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    )
  })
})
