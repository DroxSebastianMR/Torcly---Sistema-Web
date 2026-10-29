// @vitest-environment jsdom

import { useState } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmationDialog } from './confirmation-dialog'
import type { ConfirmationDialogProps } from './confirmation-dialog.types'

function renderDialog(props: Partial<ConfirmationDialogProps> = {}) {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()
  const utils = render(
    <ConfirmationDialog
      open
      title="Desactivar acceso"
      description="La sesión del usuario se cerrará."
      confirmLabel="Desactivar"
      cancelLabel="Cancelar"
      {...props}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { onCancel, onConfirm, utils }
}

describe('ConfirmationDialog', () => {
  afterEach(cleanup)

  it('muestra el título, la descripción y las acciones esperadas', () => {
    renderDialog()

    expect(screen.getByText('Desactivar acceso')).toBeTruthy()
    expect(screen.getByText('La sesión del usuario se cerrará.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy()
  })

  it('cierra al cancelar sin ejecutar la confirmación', async () => {
    const user = userEvent.setup()
    const { onCancel, onConfirm } = renderDialog()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('ejecuta la confirmación y cierra cuando la acción termina bien', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(() => Promise.resolve())
    const onCancel = vi.fn()
    render(
      <ConfirmationDialog
        open
        title="Confirmar"
        confirmLabel="Confirmar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce())
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('se mantiene abierto cuando la acción informa un error', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn(() => Promise.reject(new Error('Falló')))
    const onCancel = vi.fn()
    render(
      <ConfirmationDialog
        open
        title="Confirmar"
        confirmLabel="Confirmar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => {
      expect(
        (
          screen.getByRole('button', {
            name: 'Confirmar',
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false)
    })
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('bloquea el doble envío y bloquea las acciones mientras confirma', async () => {
    const user = userEvent.setup()
    let resolveConfirm!: () => void
    const onConfirm = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve
        }),
    )
    const onCancel = vi.fn()
    render(
      <ConfirmationDialog
        open
        title="Confirmar"
        confirmLabel="Confirmar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(
      (screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Cerrar' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)

    resolveConfirm()
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce())
  })

  it('responde a Escape solo cuando no está ocupado', async () => {
    const user = userEvent.setup()
    const { onCancel } = renderDialog()
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledOnce()

    const busy = renderDialog({ pending: true })
    await user.keyboard('{Escape}')
    expect(busy.onCancel).not.toHaveBeenCalled()
  })

  it('inicia el foco en la confirmación y lo mantiene dentro del diálogo', async () => {
    const user = userEvent.setup()
    renderDialog()

    const confirm = screen.getByRole('button', { name: 'Desactivar' })
    await waitFor(() => expect(document.activeElement).toBe(confirm))

    await user.tab()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cerrar' }),
    )

    await user.tab()
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Cancelar' }),
    )

    await user.tab()
    expect(document.activeElement).toBe(confirm)
  })

  it('devuelve el foco al elemento que abrió el diálogo al cerrar', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir diálogo
          </button>
          <ConfirmationDialog
            open={open}
            title="Confirmar"
            confirmLabel="Confirmar"
            onConfirm={() => Promise.resolve()}
            onCancel={() => setOpen(false)}
          />
        </>
      )
    }
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'Abrir diálogo' })

    await user.click(opener)
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Confirmar' }),
      ),
    )

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it('muestra el ícono antes del título y la descripción', () => {
    renderDialog()

    const dialog = screen.getByRole('dialog')
    const icon = dialog.querySelector('span.rounded-full') as HTMLSpanElement
    const title = dialog.querySelector('h2') as HTMLHeadingElement

    expect(icon).toBeTruthy()
    expect(icon.compareDocumentPosition(title)).toBe(
      document.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('aplica la apariencia de cada variante al botón de confirmación', () => {
    const { utils } = renderDialog({ variant: 'danger' })
    expect(
      screen.getByRole('button', { name: 'Desactivar' }).className,
    ).toContain('bg-amber-600')

    utils.rerender(
      <ConfirmationDialog
        open
        title="Reactivar"
        confirmLabel="Reactivar"
        variant="success"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Reactivar' }).className,
    ).toContain('bg-emerald-600')

    utils.rerender(
      <ConfirmationDialog
        open
        title="Informar"
        confirmLabel="Aceptar"
        variant="info"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    const infoConfirm = screen.getByRole('button', { name: 'Aceptar' })
    expect(infoConfirm.className).toContain('bg-primary')
    expect(infoConfirm.className).not.toContain('bg-amber-600')
  })
})
