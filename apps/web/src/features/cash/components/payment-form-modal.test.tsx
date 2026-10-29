// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentFormModal } from './payment-form-modal'
import type { PaymentObligationSummary } from '../types/payment.types'

const payments = vi.hoisted(() => ({ usePaymentMutations: vi.fn() }))
vi.mock('../hooks/use-payments', () => payments)

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const obligation: PaymentObligationSummary = {
  id: 'sale-1',
  code: 'VENTA-000001',
  customer: null,
  status: 'CONFIRMED',
  total: 200,
  paid: 49.5,
  balance: 150.5,
  collectionStatus: 'PARTIALLY_PAID',
  confirmedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
}

function mutationsMock() {
  return {
    pay: { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) },
    compensate: { isPending: false, mutateAsync: vi.fn() },
  }
}

function renderModal() {
  const onClose = vi.fn()
  render(<PaymentFormModal open obligation={obligation} onClose={onClose} />)
  return { onClose }
}

describe('Formulario de cobro (QA-07)', () => {
  beforeEach(() => {
    payments.usePaymentMutations.mockReturnValue(mutationsMock())
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'req-payment-1'),
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('conserva 100.00 mientras se escribe y envía el importe numérico', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    payments.usePaymentMutations.mockReturnValue(mutations)
    const { onClose } = renderModal()
    const input = screen.getByLabelText('Importe a cobrar') as HTMLInputElement

    expect(input.value).toBe('150.50')

    await user.clear(input)
    await user.type(input, '100.')
    expect(input.value).toBe('100.')
    await user.type(input, '00')
    expect(input.value).toBe('100.00')

    await user.click(screen.getByRole('button', { name: 'Registrar pago' }))

    await waitFor(() =>
      expect(mutations.pay.mutateAsync).toHaveBeenCalledTimes(1),
    )
    expect(mutations.pay.mutateAsync).toHaveBeenCalledWith({
      saleId: 'sale-1',
      input: {
        requestId: 'req-payment-1',
        amount: 100,
        method: 'CASH',
        notes: undefined,
      },
    })
    expect(toast.success).toHaveBeenCalledWith('Pago registrado correctamente.')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('normaliza el importe a dos decimales al salir del campo', async () => {
    const user = userEvent.setup()
    renderModal()
    const input = screen.getByLabelText('Importe a cobrar') as HTMLInputElement

    await user.clear(input)
    await user.type(input, '100')
    await user.tab()

    expect(input.value).toBe('100.00')
  })

  it('rechaza un importe mayor al saldo sin registrar el pago', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    payments.usePaymentMutations.mockReturnValue(mutations)
    renderModal()
    const input = screen.getByLabelText('Importe a cobrar')

    await user.clear(input)
    await user.type(input, '200')
    await user.click(screen.getByRole('button', { name: 'Registrar pago' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('El importe supera el saldo pendiente'),
      ),
    )
    expect(mutations.pay.mutateAsync).not.toHaveBeenCalled()
  })

  it('rechaza cero o más de dos decimales sin registrar el pago', async () => {
    const user = userEvent.setup()
    const mutations = mutationsMock()
    payments.usePaymentMutations.mockReturnValue(mutations)
    renderModal()
    const input = screen.getByLabelText('Importe a cobrar')
    const submit = screen.getByRole('button', { name: 'Registrar pago' })

    for (const value of ['0', '100.001']) {
      await user.clear(input)
      await user.type(input, value)
      await user.click(submit)
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Revisa el importe y el método de pago.',
        ),
      )
      toast.error.mockClear()
    }

    expect(mutations.pay.mutateAsync).not.toHaveBeenCalled()
  })
})
