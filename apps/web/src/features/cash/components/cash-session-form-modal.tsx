import { useCallback, useState } from 'react'
import { Landmark } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useCashSessionMutations } from '../hooks/use-cash-sessions'
import type { CashSession } from '../types/cash-session.types'
import {
  currencyFormatter,
  getPaymentErrorMessage,
} from '../utils/payment-formatters'

interface CashSessionFormModalProps {
  mode: 'open' | 'close'
  session: CashSession | null
  open: boolean
  onClose: () => void
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null
  const result = Number(normalized)
  return Number.isFinite(result) && result >= 0 ? result : null
}

export function CashSessionFormModal({
  mode,
  session,
  open,
  onClose,
}: CashSessionFormModalProps) {
  const mutations = useCashSessionMutations()
  const closing = mode === 'close'
  const expected = session?.totals.expectedCashAmount ?? 0
  const [amount, setAmount] = useState(() =>
    closing ? expected.toFixed(2) : '0.00',
  )
  const [notes, setNotes] = useState('')
  const busy = closing ? mutations.close.isPending : mutations.open.isPending
  const handleClose = useCallback(() => {
    if (!busy) onClose()
  }, [busy, onClose])

  const submit = async () => {
    const parsedAmount = parseAmount(amount)
    if (parsedAmount === null) {
      toast.error('Ingresa un importe válido de hasta dos decimales.')
      return
    }
    const normalizedNotes = notes.trim() || undefined
    if (closing && parsedAmount !== expected && !normalizedNotes) {
      toast.error('Indica el motivo de la diferencia de caja.')
      return
    }
    try {
      if (closing) {
        if (!session) return
        await mutations.close.mutateAsync({
          id: session.id,
          input: {
            requestId: crypto.randomUUID(),
            countedCashAmount: parsedAmount,
            notes: normalizedNotes,
          },
        })
        toast.success('Caja cerrada correctamente.')
      } else {
        await mutations.open.mutateAsync({
          requestId: crypto.randomUUID(),
          openingAmount: parsedAmount,
          notes: normalizedNotes,
        })
        toast.success('Caja abierta correctamente.')
      }
      onClose()
    } catch (error) {
      toast.error(getPaymentErrorMessage(error))
    }
  }

  const difference = closing ? (parseAmount(amount) ?? 0) : 0
  const requiresNotes = closing && difference !== expected

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={closing ? 'Cerrar caja' : 'Abrir caja'}
      description={
        closing
          ? 'Confirma el efectivo físico antes de finalizar este período.'
          : 'Registra el efectivo físico con el que inicia este período.'
      }
      visual={
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
          <Landmark aria-hidden className="size-6" />
        </span>
      }
      className="max-w-lg"
      busy={busy}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button type="button" loading={busy} onClick={() => void submit()}>
            {closing ? 'Registrar cierre' : 'Abrir caja'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {closing && session && (
          <div className="rounded-xl bg-muted/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Efectivo esperado
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-brand-forest">
              {currencyFormatter.format(expected)}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="cash-session-amount" className="text-sm font-medium">
            {closing ? 'Efectivo contado' : 'Monto inicial'}
          </label>
          <Input
            id="cash-session-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            disabled={busy}
          />
        </div>
        {closing && (
          <p className="text-sm text-muted-foreground">
            Diferencia estimada:{' '}
            <strong className="tabular-nums text-foreground">
              {currencyFormatter.format(difference - expected)}
            </strong>
          </p>
        )}
        <div className="space-y-2">
          <label htmlFor="cash-session-notes" className="text-sm font-medium">
            Observación {requiresNotes ? '' : '(opcional)'}
          </label>
          <textarea
            id="cash-session-notes"
            value={notes}
            disabled={busy}
            maxLength={300}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={
              requiresNotes
                ? 'Explica la diferencia de caja…'
                : 'Añade una observación si es necesaria…'
            }
            className="min-h-24 w-full resize-y rounded-[10px] border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/70"
          />
          {requiresNotes && (
            <p className="text-xs text-amber-700">
              La observación es obligatoria cuando existe diferencia.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
