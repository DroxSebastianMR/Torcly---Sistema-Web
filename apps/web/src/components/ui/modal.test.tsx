// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Modal } from './modal'

function Dialogs({ first, second }: { first: boolean; second: boolean }) {
  return (
    <>
      <Modal open={first} title="Primer diálogo" onClose={vi.fn()}>
        Primer contenido
      </Modal>
      <Modal open={second} title="Segundo diálogo" onClose={vi.fn()}>
        Segundo contenido
      </Modal>
    </>
  )
}

describe('Modal', () => {
  afterEach(() => {
    cleanup()
    document.body.style.overflow = ''
  })

  it('mantiene el scroll bloqueado hasta cerrar el último diálogo abierto', () => {
    const view = render(<Dialogs first second={false} />)
    expect(document.body.style.overflow).toBe('hidden')

    view.rerender(<Dialogs first second />)
    view.rerender(<Dialogs first={false} second />)
    expect(document.body.style.overflow).toBe('hidden')

    view.rerender(<Dialogs first={false} second={false} />)
    expect(document.body.style.overflow).toBe('')
  })

  it('conserva el foco al cambiar callbacks mientras se escribe', () => {
    const firstClose = vi.fn()
    const secondClose = vi.fn()
    const view = render(
      <Modal open title="Diálogo editable" onClose={firstClose}>
        <input aria-label="Motivo" />
      </Modal>,
    )
    const input = screen.getByLabelText('Motivo')
    input.focus()

    view.rerender(
      <Modal open title="Diálogo editable" onClose={secondClose}>
        <input aria-label="Motivo" />
      </Modal>,
    )

    expect(document.activeElement).toBe(input)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(firstClose).not.toHaveBeenCalled()
    expect(secondClose).toHaveBeenCalledOnce()
  })
})
