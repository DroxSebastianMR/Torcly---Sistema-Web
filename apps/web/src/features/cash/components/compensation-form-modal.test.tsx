// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CompensationFormModal } from './compensation-form-modal'
import type { PaymentEvent } from '../types/payment.types'

const payments = vi.hoisted(() => ({ usePaymentMutations: vi.fn() }))
vi.mock('../hooks/use-payments', () => payments)

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const event: PaymentEvent = {
  id: 'payment-1',
  code: 'PAGO-000001',
  type: 'PAYMENT',
  amount: 80,
  netAmount: 80,
  method: 'CASH',
  performedBy: 'Admin',
  notes: null,
  reason: null,
  originalCode: null,
  occurredAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
}

function mutationsMock() {
  return {
    pay: { isPending: false, mutateAsync: vi.fn() },
    compensate: {
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({}),
    },
  }
}

describe('Formulario de compensación (QA-07)', () => {
  beforeEach(() => {
    payments.usePaymentMutations.mockReturnValue(mutationsMock())
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'req-compensation-1'),
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('conserva el string del importe y envía el número al confirmar', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    payments.usePaymentMutations.mockReturnValue(mutations)
    const onClose = vi.fn()
    render(<CompensationFormModal open event={event} onClose={onClose} />)
    const input = screen.getByLabelText(
      'Importe a compensar',
    ) as HTMLInputElement

    expect(input.value).toBe('80.00')

    await user.clear(input)
    await user.type(input, '50.00')
    const reasonInput = screen.getByLabelText('Motivo de la compensación')
    await user.type(reasonInput, 'Cobro duplicado')
    expect((reasonInput as HTMLInputElement).value).toBe('Cobro duplicado')
    await user.click(
      screen.getByRole('button', { name: 'Registrar compensación' }),
    )

    await waitFor(() =>
      expect(mutations.compensate.mutateAsync).toHaveBeenCalledTimes(1),
    )
    expect(mutations.compensate.mutateAsync).toHaveBeenCalledWith({
      paymentId: 'payment-1',
      input: {
        requestId: 'req-compensation-1',
        amount: 50,
        reason: 'Cobro duplicado',
        notes: undefined,
      },
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
