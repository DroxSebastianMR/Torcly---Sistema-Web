import { useState } from 'react'
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  Coins,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import { currencyFormatter } from '../utils/sale-formatters'
import type {
  ImmediatePaymentMethod,
  SaleConfirmAndPayInput,
} from '../types/sales.types'

interface SalePaymentModalProps {
  open: boolean
  total: number
  saleCode?: string
  loading?: boolean
  onClose: () => void
  onConfirmAndPay: (input: SaleConfirmAndPayInput) => Promise<void>
  onConfirmPending: (input?: SaleConfirmAndPayInput) => Promise<void>
}

const paymentMethodOptions = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'DIGITAL_WALLET', label: 'Yape / Plin' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
]

function toPaymentAmount(value: string) {
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0
    ? Math.round((amount + Number.EPSILON) * 100) / 100
    : 0
}

function normalizePaymentAmount(value: string) {
  if (!value.trim()) return ''
  return String(toPaymentAmount(value))
}

export function SalePaymentModal({
  open,
  total,
  saleCode,
  loading = false,
  onClose,
  onConfirmAndPay,
  onConfirmPending,
}: SalePaymentModalProps) {
  const [method, setMethod] = useState<ImmediatePaymentMethod>('CASH')
  const [cashReceived, setCashReceived] = useState<number>(total)
  const [notes, setNotes] = useState('')

  // Para pago mixto
  const [mixedMethod1, setMixedMethod1] = useState<
    'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET'
  >('CASH')
  const [mixedAmount1, setMixedAmount1] = useState(
    String(Math.round(total / 2)),
  )
  const [mixedMethod2, setMixedMethod2] = useState<
    'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET'
  >('DIGITAL_WALLET')
  const [mixedAmount2, setMixedAmount2] = useState(
    String(
      Math.round((total - Math.round(total / 2) + Number.EPSILON) * 100) / 100,
    ),
  )

  const mixedAmount1Value = toPaymentAmount(mixedAmount1)
  const mixedAmount2Value = toPaymentAmount(mixedAmount2)
  const mixedTotal =
    Math.round((mixedAmount1Value + mixedAmount2Value + Number.EPSILON) * 100) /
    100
  const mixedDifference =
    Math.round((total - mixedTotal + Number.EPSILON) * 100) / 100
  const isMixedPaymentComplete = mixedDifference === 0

  const change = Math.max(
    0,
    Math.round((cashReceived - total + Number.EPSILON) * 100) / 100,
  )
  const missingCash =
    cashReceived < total
      ? Math.round((total - cashReceived + Number.EPSILON) * 100) / 100
      : 0

  const handlePay = async () => {
    if (method === 'CASH') {
      if (cashReceived < total) return
      await onConfirmAndPay({
        paymentMethod: 'CASH',
        amountPaid: total,
        cashReceived,
        cashChange: change,
        notes: notes.trim() || undefined,
      })
    } else if (method === 'MIXED') {
      if (!isMixedPaymentComplete) return
      await onConfirmAndPay({
        paymentMethod: 'MIXED',
        amountPaid: total,
        notes: notes.trim() || undefined,
        splitPayments: [
          { method: mixedMethod1, amount: mixedAmount1Value },
          { method: mixedMethod2, amount: mixedAmount2Value },
        ],
      })
    } else {
      await onConfirmAndPay({
        paymentMethod: method,
        amountPaid: total,
        notes: notes.trim() || undefined,
      })
    }
  }

  const handleLeavePending = async () => {
    if (method !== 'MIXED' || mixedTotal <= 0 || mixedDifference < 0) {
      await onConfirmPending()
      return
    }

    await onConfirmPending({
      paymentMethod: 'MIXED',
      amountPaid: mixedTotal,
      notes: notes.trim() || undefined,
      splitPayments: [
        { method: mixedMethod1, amount: mixedAmount1Value },
        { method: mixedMethod2, amount: mixedAmount2Value },
      ].filter((payment) => payment.amount > 0),
    })
  }

  const setSuggestedCash = (amount: number) => {
    setCashReceived(amount)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        saleCode ? `Cobro de venta ${saleCode}` : 'Cobro inmediato en mostrador'
      }
      description="Selecciona el método de cobro directo para registrar el ingreso a caja."
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            disabled={loading || (method === 'MIXED' && mixedDifference < 0)}
            onClick={() => void handleLeavePending()}
            className="shrink-0 border-amber-500/80 bg-amber-50 text-amber-900 hover:border-amber-600 hover:bg-amber-100"
          >
            <Clock size={16} /> Dejar a crédito
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={
                loading ||
                (method === 'CASH' && cashReceived < total) ||
                (method === 'MIXED' && !isMixedPaymentComplete)
              }
              onClick={handlePay}
            >
              <CheckCircle2 size={16} className="mr-1.5" />
              {loading ? 'Procesando…' : 'Finalizar cobro'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Banner de Total */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Total a cobrar
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-900">
            {currencyFormatter.format(total)}
          </p>
        </div>

        {/* Métodos de Pago */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Método de cobro
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => {
                setMethod('CASH')
                setCashReceived(total)
              }}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                method === 'CASH'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Banknote
                size={20}
                className={method === 'CASH' ? 'text-emerald-600' : ''}
              />
              <span>Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('DIGITAL_WALLET')}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                method === 'DIGITAL_WALLET'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <QrCode
                size={20}
                className={
                  method === 'DIGITAL_WALLET' ? 'text-emerald-600' : ''
                }
              />
              <span>Yape / Plin</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('CARD')}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                method === 'CARD'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <CreditCard
                size={20}
                className={method === 'CARD' ? 'text-emerald-600' : ''}
              />
              <span>Tarjeta</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('TRANSFER')}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                method === 'TRANSFER'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <ArrowRightLeft
                size={20}
                className={method === 'TRANSFER' ? 'text-emerald-600' : ''}
              />
              <span>Transferencia</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('MIXED')}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                method === 'MIXED'
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Coins
                size={20}
                className={method === 'MIXED' ? 'text-emerald-600' : ''}
              />
              <span>Mixto</span>
            </button>
          </div>
        </div>

        {/* Sección específica de Efectivo */}
        {method === 'CASH' && (
          <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Monto recibido en efectivo (S/)
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="text-lg font-bold tabular-nums"
              />
            </div>

            {/* Sugerencias rápidas de billetes */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSuggestedCash(total)}
                className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-emerald-500 hover:text-emerald-700"
              >
                Exacto ({currencyFormatter.format(total)})
              </button>
              {[20, 50, 100, 200]
                .filter((bill) => bill >= total)
                .map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => setSuggestedCash(bill)}
                    className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-emerald-500 hover:text-emerald-700"
                  >
                    S/ {bill}.00
                  </button>
                ))}
            </div>

            {/* Cálculo de vuelto */}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-medium text-muted-foreground">
                Vuelto a entregar:
              </span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  missingCash > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {missingCash > 0
                  ? `Faltan ${currencyFormatter.format(missingCash)}`
                  : currencyFormatter.format(change)}
              </span>
            </div>
          </div>
        )}

        {/* Sección de Pago Mixto */}
        {method === 'MIXED' && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-foreground">
              Desglose de montos por método
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <SmartSelect
                  value={mixedMethod1}
                  aria-label="Primer método de pago"
                  options={paymentMethodOptions}
                  onChange={(value) =>
                    setMixedMethod1(value as typeof mixedMethod1)
                  }
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  aria-label="Primer importe de pago mixto"
                  value={mixedAmount1}
                  onChange={(event) => {
                    const value = event.target.value.replace(',', '.')
                    if (/^\d*(?:\.\d{0,2})?$/.test(value))
                      setMixedAmount1(value)
                  }}
                  onBlur={() =>
                    setMixedAmount1(normalizePaymentAmount(mixedAmount1))
                  }
                />
              </div>

              <div className="space-y-2">
                <SmartSelect
                  value={mixedMethod2}
                  aria-label="Segundo método de pago"
                  options={paymentMethodOptions}
                  onChange={(value) =>
                    setMixedMethod2(value as typeof mixedMethod2)
                  }
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  aria-label="Segundo importe de pago mixto"
                  value={mixedAmount2}
                  onChange={(event) => {
                    const value = event.target.value.replace(',', '.')
                    if (/^\d*(?:\.\d{0,2})?$/.test(value))
                      setMixedAmount2(value)
                  }}
                  onBlur={() =>
                    setMixedAmount2(normalizePaymentAmount(mixedAmount2))
                  }
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Suma: {currencyFormatter.format(mixedTotal)}</span>
              <span>Total requerido: {currencyFormatter.format(total)}</span>
            </div>
            {!isMixedPaymentComplete && (
              <p
                role="alert"
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900"
              >
                {mixedDifference > 0
                  ? `Faltan ${currencyFormatter.format(mixedDifference)} para completar el cobro. Ajusta los montos o deja el saldo como crédito.`
                  : `El desglose supera el total por ${currencyFormatter.format(Math.abs(mixedDifference))}. Ajusta los montos para finalizar.`}
              </p>
            )}
          </div>
        )}

        {/* Notas / Referencia de pago */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Referencia o notas del cobro (opcional)
          </label>
          <Input
            type="text"
            placeholder="N° operación, banco, observaciones…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>
    </Modal>
  )
}
