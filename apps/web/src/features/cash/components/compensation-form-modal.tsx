import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { usePaymentMutations } from '../hooks/use-payments'
import {
  paymentCompensationSchema,
  type PaymentCompensationFormValues,
} from '../forms/payment.schema'
import type { PaymentEvent } from '../types/payment.types'
import {
  currencyFormatter,
  getPaymentErrorMessage,
  paymentMethodLabel,
} from '../utils/payment-formatters'

interface CompensationFormModalProps {
  open: boolean
  event: PaymentEvent | null
  onClose: () => void
}

export function CompensationFormModal({
  open,
  event,
  onClose,
}: CompensationFormModalProps) {
  const mutations = usePaymentMutations()
  const form = useForm<PaymentCompensationFormValues>({
    resolver: zodResolver(paymentCompensationSchema),
    defaultValues: { amount: 0, reason: '', notes: '' },
  })
  const { reset, getValues, setValue } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.compensate.isPending
  const amount = useWatch({ control: form.control, name: 'amount' })

  useEffect(() => {
    if (open) reset({ amount: event?.amount ?? 0, reason: '', notes: '' })
  }, [open, event?.amount, reset])

  const closeModal = () => {
    if (busy) return
    onClose()
  }

  const submit = async () => {
    if (!event) return
    const valid = await form.trigger()
    if (!valid) {
      toast.error('Revisa el importe y el motivo de la compensación.')
      return
    }
    const values = getValues()
    if (values.amount > event.amount) {
      toast.error(
        `La compensación no puede superar el importe del pago (${currencyFormatter.format(
          event.amount,
        )}).`,
      )
      return
    }
    try {
      await mutations.compensate.mutateAsync({
        paymentId: event.id,
        input: {
          requestId: crypto.randomUUID(),
          amount: values.amount,
          reason: values.reason.trim(),
          notes: values.notes?.trim() || undefined,
        },
      })
      toast.success('Compensación registrada correctamente.')
      onClose()
    } catch (error) {
      toast.error(getPaymentErrorMessage(error))
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void submit()
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Compensar pago"
      description="Corrige un cobro registrado sin editarlo ni eliminarlo; la compensación queda en el historial."
      className="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Registrando…' : 'Registrar compensación'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {event && (
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{event.code}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {paymentMethodLabel[event.method]} · Pagó{' '}
                  <span className="font-semibold tabular-nums text-foreground">
                    {currencyFormatter.format(event.amount)}
                  </span>
                </p>
              </div>
              <Undo2 aria-hidden className="shrink-0 text-muted-foreground" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="compensation-amount"
            className="text-sm font-medium text-foreground"
          >
            Importe a compensar
          </label>
          <Input
            id="compensation-amount"
            aria-label="Importe a compensar"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={Number.isNaN(amount) ? '' : String(amount)}
            onChange={(event) =>
              setValue(
                'amount',
                event.target.value === '' ? 0 : Number(event.target.value),
              )
            }
          />
          {formState.errors.amount && (
            <p className="text-xs text-red-600">
              {formState.errors.amount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="compensation-reason"
            className="text-sm font-medium text-foreground"
          >
            Motivo
          </label>
          <Input
            id="compensation-reason"
            aria-label="Motivo de la compensación"
            placeholder="Ej.: Cobro duplicado"
            value={form.getValues('reason')}
            onChange={(event) => setValue('reason', event.target.value)}
          />
          {formState.errors.reason && (
            <p className="text-xs text-red-600">
              {formState.errors.reason.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="compensation-notes"
            className="text-sm font-medium text-foreground"
          >
            Observación{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <Input
            id="compensation-notes"
            aria-label="Observación de la compensación"
            value={form.getValues('notes') ?? ''}
            onChange={(event) => setValue('notes', event.target.value)}
          />
          {formState.errors.notes && (
            <p className="text-xs text-red-600">
              {formState.errors.notes.message}
            </p>
          )}
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Undo2 aria-hidden size={14} className="mt-0.5 shrink-0" />
          El pago original no se modifica: la compensación restaura el saldo
          pendiente y queda auditada en el historial.
        </p>
      </form>
    </Modal>
  )
}
