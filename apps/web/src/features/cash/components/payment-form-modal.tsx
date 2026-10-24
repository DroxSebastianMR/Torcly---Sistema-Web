import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useFormState } from 'react-hook-form'
import { HandCoins } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { usePaymentMutations } from '../hooks/use-payments'
import {
  formatPaymentAmount,
  parsePaymentAmount,
  paymentRegisterSchema,
  type PaymentRegisterFormValues,
} from '../forms/payment.schema'
import type { PaymentObligationSummary } from '../types/payment.types'
import {
  currencyFormatter,
  getPaymentErrorMessage,
} from '../utils/payment-formatters'

interface PaymentFormModalProps {
  open: boolean
  obligation: PaymentObligationSummary | null
  onClose: () => void
}

const methodOptions: SmartSelectOption[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'DIGITAL_WALLET', label: 'Billetera digital' },
]

export function PaymentFormModal({
  open,
  obligation,
  onClose,
}: PaymentFormModalProps) {
  const mutations = usePaymentMutations()
  const form = useForm<PaymentRegisterFormValues>({
    resolver: zodResolver(paymentRegisterSchema),
    defaultValues: { amount: '', method: 'CASH', notes: '' },
  })
  const { reset, getValues, setValue } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.pay.isPending

  useEffect(() => {
    if (open)
      reset({
        amount: formatPaymentAmount(obligation?.balance ?? 0),
        method: 'CASH',
        notes: '',
      })
  }, [open, obligation?.balance, reset])

  const closeModal = () => {
    if (busy) return
    onClose()
  }

  const submit = async () => {
    if (!obligation) return
    const valid = await form.trigger()
    if (!valid) {
      toast.error('Revisa el importe y el método de pago.')
      return
    }
    const values = getValues()
    const amount = parsePaymentAmount(values.amount)
    if (amount === null) {
      toast.error('Revisa el importe y el método de pago.')
      return
    }
    if (amount > obligation.balance) {
      toast.error(
        `El importe supera el saldo pendiente (${currencyFormatter.format(
          obligation.balance,
        )}).`,
      )
      return
    }
    try {
      await mutations.pay.mutateAsync({
        saleId: obligation.id,
        input: {
          requestId: crypto.randomUUID(),
          amount,
          method: values.method,
          notes: values.notes?.trim() || undefined,
        },
      })
      toast.success('Pago registrado correctamente.')
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
      title="Registrar cobro"
      description={
        obligation ? `Cobra la venta ${obligation.code}.` : undefined
      }
      className="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Registrando…' : 'Registrar pago'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {obligation && (
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/60 p-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {currencyFormatter.format(obligation.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {currencyFormatter.format(obligation.paid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="mt-1 text-sm font-bold tabular-nums text-emerald-700">
                {currencyFormatter.format(obligation.balance)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="payment-amount"
            className="text-sm font-medium text-foreground"
          >
            Importe
          </label>
          <Controller
            control={form.control}
            name="amount"
            render={({ field }) => (
              <Input
                id="payment-amount"
                aria-label="Importe a cobrar"
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
            htmlFor="payment-method"
            className="text-sm font-medium text-foreground"
          >
            Método de pago
          </label>
          <SmartSelect
            value={form.getValues('method')}
            aria-label="Método de pago"
            options={methodOptions}
            disabled={busy}
            onChange={(method) =>
              setValue(
                'method',
                method as PaymentRegisterFormValues['method'],
                {
                  shouldValidate: true,
                },
              )
            }
          />
          {formState.errors.method && (
            <p className="text-xs text-red-600">
              {formState.errors.method.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="payment-notes"
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
                id="payment-notes"
                aria-label="Observación del pago"
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

        {obligation && obligation.balance > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <HandCoins aria-hidden size={14} className="mt-0.5 shrink-0" />
            El pago no puede superar el saldo pendiente y se registra con un
            identificador único para no duplicarse al reintentar.
          </p>
        )}
      </form>
    </Modal>
  )
}
