// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimePicker } from './time-picker'

describe('TimePicker', () => {
  it('muestra intervalos configurables y entrega la hora elegida', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <TimePicker
        value=""
        onChange={onChange}
        interval={15}
        aria-label="Hora de inicio"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Hora de inicio' }))
    await user.click(screen.getByRole('option', { name: '00:15' }))

    expect(onChange).toHaveBeenCalledWith('00:15')
  })
})
