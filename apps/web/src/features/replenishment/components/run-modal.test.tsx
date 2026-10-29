// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RunModal } from './run-modal'

const repln = vi.hoisted(() => ({
  idempotencyKeyForRun: vi.fn(() => 'replenishment-run-abc'),
  useCreateReplenishmentRun: vi.fn(),
}))

vi.mock('../hooks/use-replenishment', () => ({
  idempotencyKeyForRun: repln.idempotencyKeyForRun,
  useCreateReplenishmentRun: repln.useCreateReplenishmentRun,
}))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

describe('Modal de ejecución de corrida de reabastecimiento', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el período y la cobertura por defecto al abrir', () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      code: 'RAB-000002',
    })
    repln.useCreateReplenishmentRun.mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    })

    render(
      <RunModal
        open
        period={{ from: '2026-10-01', to: '2026-10-31' }}
        coverageDays={30}
        onClose={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Ejecutar corrida de reabastecimiento',
      }),
    ).toBeTruthy()
    expect(screen.getByText(/01 oct\. 2026 — 31 oct\. 2026/)).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Ejecutar corrida' }),
    ).toBeTruthy()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('envía la corrida con clave de idempotencia y avisa al ejecutarla', async () => {
    const onClose = vi.fn()
    const mutateAsync = vi.fn().mockResolvedValue({ code: 'RAB-000003' })
    repln.useCreateReplenishmentRun.mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    })

    render(
      <RunModal
        open
        period={{ from: '2026-10-01', to: '2026-10-31' }}
        coverageDays={30}
        onClose={onClose}
      />,
    )

    const coverage = screen.getByLabelText(
      /Cobertura objetivo/,
    ) as HTMLInputElement
    await userEvent.clear(coverage)
    await userEvent.type(coverage, '45')
    await userEvent.click(
      screen.getByRole('button', { name: 'Ejecutar corrida' }),
    )

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        from: '2026-10-01',
        to: '2026-10-31',
        coverageDays: 45,
        idempotencyKey: 'replenishment-run-abc',
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Corrida RAB-000003 ejecutada correctamente.',
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('muestra el error del servidor sin cerrar el modal', async () => {
    const onClose = vi.fn()
    const mutateAsync = vi.fn().mockRejectedValue(new Error('red'))
    repln.useCreateReplenishmentRun.mockReturnValue({
      mutateAsync,
      isPending: false,
      reset: vi.fn(),
    })

    render(
      <RunModal
        open
        period={{ from: '2026-10-01', to: '2026-10-31' }}
        coverageDays={30}
        onClose={onClose}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Ejecutar corrida' }),
    )

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })
})
