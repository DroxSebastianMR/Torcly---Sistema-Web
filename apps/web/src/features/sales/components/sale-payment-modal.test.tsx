// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SalePaymentModal } from './sale-payment-modal'

describe('SalePaymentModal', () => {
  const onConfirmAndPay = vi.fn()
  const onConfirmPending = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    onConfirmAndPay.mockReset()
    onConfirmPending.mockReset()
    onClose.mockReset()
    onConfirmAndPay.mockResolvedValue(undefined)
    onConfirmPending.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renderiza monto total y opciones de pago', () => {
    render(
      <SalePaymentModal
        open={true}
        total={150}
        saleCode="V-000123"
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    expect(screen.getByText(/Cobro de venta V-000123/i)).toBeTruthy()
    expect(screen.getByText('Efectivo')).toBeTruthy()
    expect(screen.getByText('Yape / Plin')).toBeTruthy()
    expect(screen.getByText('Tarjeta')).toBeTruthy()
    expect(screen.getByText('Transferencia')).toBeTruthy()
    expect(screen.getByText('Mixto')).toBeTruthy()
  })

  it('permite registrar cobro en efectivo y calcula vuelto', async () => {
    render(
      <SalePaymentModal
        open={true}
        total={100}
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    // Botón chip S/ 200.00
    const chip200 = screen.getByRole('button', { name: /S\/\s*200/i })
    fireEvent.click(chip200)

    // Debe mostrar vuelto
    expect(screen.getByText(/Vuelto a entregar/i)).toBeTruthy()

    // Clic en registrar cobro
    const submitBtn = screen.getByRole('button', {
      name: /Cobrar y Finalizar/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onConfirmAndPay).toHaveBeenCalledWith({
        paymentMethod: 'CASH',
        amountPaid: 100,
        cashReceived: 200,
        cashChange: 100,
        notes: undefined,
      })
    })
  })

  it('permite cambiar a método Yape / Plin', async () => {
    render(
      <SalePaymentModal
        open={true}
        total={85.5}
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    const yapeBtn = screen.getByRole('button', { name: /Yape \/ Plin/i })
    fireEvent.click(yapeBtn)

    const submitBtn = screen.getByRole('button', {
      name: /Cobrar y Finalizar/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onConfirmAndPay).toHaveBeenCalledWith({
        paymentMethod: 'DIGITAL_WALLET',
        amountPaid: 85.5,
        notes: undefined,
      })
    })
  })

  it('bloquea el cierre de un pago mixto incompleto e informa el saldo faltante', () => {
    render(
      <SalePaymentModal
        open={true}
        total={400}
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mixto' }))
    fireEvent.change(screen.getByLabelText('Primer importe de pago mixto'), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText('Segundo importe de pago mixto'), {
      target: { value: '200' },
    })

    expect(screen.getByRole('alert').textContent).toContain('Faltan S/')
    expect(screen.getByRole('alert').textContent).toContain('100.00')
    expect(
      (
        screen.getByRole('button', {
          name: /Cobrar y Finalizar/i,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })

  it('permite editar un importe mixto sin anteponer ceros', () => {
    render(
      <SalePaymentModal
        open={true}
        total={400}
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mixto' }))
    const firstAmount = screen.getByLabelText('Primer importe de pago mixto')
    fireEvent.change(firstAmount, { target: { value: '100' } })
    fireEvent.blur(firstAmount)

    expect((firstAmount as HTMLInputElement).value).toBe('100')
  })

  it('registra el pago mixto parcial solo al elegir dejar saldo pendiente', async () => {
    render(
      <SalePaymentModal
        open={true}
        total={400}
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mixto' }))
    fireEvent.change(screen.getByLabelText('Primer importe de pago mixto'), {
      target: { value: '100' },
    })
    fireEvent.change(screen.getByLabelText('Segundo importe de pago mixto'), {
      target: { value: '200' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /Dejar pendiente \(Crédito\)/i }),
    )

    await waitFor(() => {
      expect(onConfirmPending).toHaveBeenCalledWith({
        paymentMethod: 'MIXED',
        amountPaid: 300,
        notes: undefined,
        splitPayments: [
          { method: 'CASH', amount: 100 },
          { method: 'DIGITAL_WALLET', amount: 200 },
        ],
      })
    })
  })

  it('permite dejar como cobro pendiente en caja (Crédito)', async () => {
    render(
      <SalePaymentModal
        open={true}
        total={250}
        onClose={onClose}
        onConfirmAndPay={onConfirmAndPay}
        onConfirmPending={onConfirmPending}
      />,
    )

    const creditBtn = screen.getByRole('button', {
      name: /Dejar pendiente \(Crédito\)/i,
    })
    fireEvent.click(creditBtn)

    await waitFor(() => {
      expect(onConfirmPending).toHaveBeenCalled()
    })
  })
})
