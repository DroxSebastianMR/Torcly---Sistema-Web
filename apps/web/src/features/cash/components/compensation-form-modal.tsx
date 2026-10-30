import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useFormState } from 'react-hook-form'
import { Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { usePaymentMutations } from '../hooks/use-payments'
import {
  formatPaymentAmount,
  parsePaymentAmount,
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
  remainingAmount?: number
  onClose: () => void
}

export function CompensationFormModal({
  open,
  event,
  remainingAmount,
  onClose,
}: CompensationFormModalProps) {
  const mutations = usePaymentMutations()
  const form = useForm<PaymentCompensationFormValues>({
    resolver: zodResolver(paymentCompensationSchema),
    defaultValues: { amount: '', reason: '', notes: '' },
  })
  const { reset, getValues } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.compensate.isPending

  useEffect(() => {
    if (open)
      reset({
        amount: formatPaymentAmount(remainingAmount ?? event?.amount ?? 0),
        reason: '',
        notes: '',
      })
  }, [open, event?.amount, remainingAmount, reset])

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
    const amount = parsePaymentAmount(values.amount)
    if (amount === null) {
      toast.error('Revisa el importe y el motivo de la compensación.')
      return
    }
    const maximumAmount = remainingAmount ?? event.amount
    if (amount > maximumAmount) {
      toast.error(
        `La compensación no puede superar el importe del pago (${currencyFormatter.format(
          maximumAmount,
        )}).`,
      )
      return
    }
    try {
      await mutations.compensate.mutateAsync({
        paymentId: event.id,
        input: {
          requestId: crypto.randomUUID(),
          amount,
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
                {remainingAmount !== undefined &&
                  remainingAmount < event.amount && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Disponible por compensar:{' '}
                      <span className="font-semibold tabular-nums text-foreground">
                        {currencyFormatter.format(remainingAmount)}
                      </span>
                    </p>
                  )}
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
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Input
                id="compensation-amount"
                aria-label="Importe a compensar"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={() => {
                  const parsed = parsePaymentAmount(field.value)
                  if (parsed !== null) {
                    field.onChange(formatPaymentAmount(parsed))
                  }
                }}
              />
            )}
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
          <Controller
            control={form.control}
            name="reason"
            render={({ field }) => (
              <Input
                id="compensation-reason"
                aria-label="Motivo de la compensación"
                placeholder="Ej.: Cobro duplicado"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
              />
            )}
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
          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <Input
                id="compensation-notes"
                aria-label="Observación de la compensación"
                name={field.name}
                ref={field.ref}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
              />
            )}
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
