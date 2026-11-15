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
import { Modal } from '@/components/ui/modal'
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
  onConfirmPending: () => Promise<void>
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
  const [mixedAmount1, setMixedAmount1] = useState<number>(
    Math.round(total / 2),
  )
  const [mixedMethod2, setMixedMethod2] = useState<
    'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET'
  >('DIGITAL_WALLET')
  const [mixedAmount2, setMixedAmount2] = useState<number>(
    Math.round((total - Math.round(total / 2) + Number.EPSILON) * 100) / 100,
  )

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
      const sum =
        Math.round((mixedAmount1 + mixedAmount2 + Number.EPSILON) * 100) / 100
      if (sum !== total) return
      await onConfirmAndPay({
        paymentMethod: 'MIXED',
        amountPaid: total,
        notes: notes.trim() || undefined,
        splitPayments: [
          { method: mixedMethod1, amount: mixedAmount1 },
          { method: mixedMethod2, amount: mixedAmount2 },
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
            variant="ghost"
            disabled={loading}
            onClick={onConfirmPending}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Clock size={14} className="mr-1" /> Dejar pendiente (Crédito)
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
              disabled={loading || (method === 'CASH' && cashReceived < total)}
              onClick={handlePay}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 size={16} className="mr-1.5" />
              {loading ? 'Procesando…' : 'Cobrar y Finalizar'}
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
              <input
                type="number"
                min="0"
                step="0.5"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-lg font-bold tabular-nums text-foreground focus-visible:outline-2 focus-visible:outline-primary"
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
              <div className="space-y-1">
                <select
                  value={mixedMethod1}
                  onChange={(e) =>
                    setMixedMethod1(e.target.value as typeof mixedMethod1)
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="DIGITAL_WALLET">Yape / Plin</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={mixedAmount1}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setMixedAmount1(val)
                    setMixedAmount2(
                      Math.max(
                        0,
                        Math.round((total - val + Number.EPSILON) * 100) / 100,
                      ),
                    )
                  }}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <select
                  value={mixedMethod2}
                  onChange={(e) =>
                    setMixedMethod2(e.target.value as typeof mixedMethod2)
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                >
                  <option value="DIGITAL_WALLET">Yape / Plin</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={mixedAmount2}
                  onChange={(e) => setMixedAmount2(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold tabular-nums"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>
                Suma: {currencyFormatter.format(mixedAmount1 + mixedAmount2)}
              </span>
              <span>Total requerido: {currencyFormatter.format(total)}</span>
            </div>
          </div>
        )}

        {/* Notas / Referencia de pago */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Referencia o notas del cobro (opcional)
          </label>
          <input
            type="text"
            placeholder="N° operación, banco, observaciones…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>
      </div>
    </Modal>
  )
}
