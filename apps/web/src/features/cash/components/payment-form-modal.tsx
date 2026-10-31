import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useFormState, useWatch } from 'react-hook-form'
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
  { value: 'DIGITAL_WALLET', label: 'Billetera digital (Yape/Plin)' },
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
  const firstAmount = useWatch({ control: form.control, name: 'amount' })
  const firstMethod = useWatch({ control: form.control, name: 'method' })
  const [splitPayment, setSplitPayment] = useState(false)
  const [secondAmount, setSecondAmount] = useState('')
  const [secondMethod, setSecondMethod] =
    useState<PaymentRegisterFormValues['method']>('DIGITAL_WALLET')
  const busy = mutations.pay.isPending || mutations.paySplit.isPending

  useEffect(() => {
    if (open) {
      reset({
        amount: formatPaymentAmount(obligation?.balance ?? 0),
        method: 'CASH',
        notes: '',
      })
    }
  }, [open, obligation?.balance, reset])

  const resetPaymentMode = () => {
    setSplitPayment(false)
    setSecondAmount('')
    setSecondMethod('DIGITAL_WALLET')
  }

  const enableSplitPayment = () => {
    const balance = obligation?.balance ?? 0
    const firstAmount = Math.floor(balance * 50) / 100
    setValue('amount', formatPaymentAmount(firstAmount), {
      shouldValidate: true,
    })
    setValue('method', 'CASH', { shouldValidate: true })
    setSecondAmount(formatPaymentAmount(balance - firstAmount))
    setSecondMethod('DIGITAL_WALLET')
    setSplitPayment(true)
  }

  const closeModal = () => {
    if (busy) return
    resetPaymentMode()
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
    const parsedSecondAmount = splitPayment
      ? parsePaymentAmount(secondAmount)
      : null
    if (splitPayment && parsedSecondAmount === null) {
      toast.error('Ingresa un segundo importe válido y mayor a cero.')
      return
    }
    if (splitPayment && values.method === secondMethod) {
      toast.error('Selecciona dos métodos de pago diferentes.')
      return
    }
    const totalAmount = amount + (parsedSecondAmount ?? 0)
    if (totalAmount > obligation.balance) {
      toast.error(
        `${splitPayment ? 'El importe total' : 'El importe'} supera el saldo pendiente (${currencyFormatter.format(obligation.balance)}).`,
      )
      return
    }
    try {
      const requestId = crypto.randomUUID()
      const notes = values.notes?.trim() || undefined
      if (splitPayment && parsedSecondAmount !== null) {
        await mutations.paySplit.mutateAsync({
          saleId: obligation.id,
          input: {
            requestId,
            payments: [
              { amount, method: values.method },
              { amount: parsedSecondAmount, method: secondMethod },
            ],
            notes,
          },
        })
        toast.success('Pago mixto registrado correctamente.')
      } else {
        await mutations.pay.mutateAsync({
          saleId: obligation.id,
          input: {
            requestId,
            amount,
            method: values.method,
            notes,
          },
        })
        toast.success('Pago registrado correctamente.')
      }
      resetPaymentMode()
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
            {busy
              ? 'Registrando…'
              : splitPayment
                ? 'Registrar pago mixto'
                : 'Registrar pago'}
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

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/55 p-1.5">
          <Button
            type="button"
            variant={splitPayment ? 'ghost' : 'default'}
            onClick={() => {
              setSplitPayment(false)
              setValue('amount', formatPaymentAmount(obligation?.balance ?? 0))
            }}
          >
            Un método
          </Button>
          <Button
            type="button"
            variant={splitPayment ? 'default' : 'ghost'}
            onClick={enableSplitPayment}
          >
            Pago mixto
          </Button>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="payment-amount"
            className="text-sm font-medium text-foreground"
          >
            {splitPayment ? 'Primer importe' : 'Importe'}
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
            {splitPayment ? 'Primer método' : 'Método de pago'}
          </label>
          <SmartSelect
            value={firstMethod}
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

        {splitPayment && (
          <div className="grid gap-4 rounded-xl border border-primary/20 bg-emerald-50/35 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="payment-second-amount"
                className="text-sm font-medium text-foreground"
              >
                Segundo importe
              </label>
              <Input
                id="payment-second-amount"
                aria-label="Segundo importe a cobrar"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={secondAmount}
                onChange={(event) => setSecondAmount(event.target.value)}
                onBlur={() => {
                  const parsed = parsePaymentAmount(secondAmount)
                  if (parsed !== null) {
                    setSecondAmount(formatPaymentAmount(parsed))
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Segundo método
              </label>
              <SmartSelect
                value={secondMethod}
                aria-label="Segundo método de pago"
                options={methodOptions}
                disabled={busy}
                onChange={(method) =>
                  setSecondMethod(method as PaymentRegisterFormValues['method'])
                }
              />
            </div>
            <SplitPaymentSummary
              balance={obligation?.balance ?? 0}
              firstAmount={firstAmount}
              secondAmount={secondAmount}
            />
          </div>
        )}

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
            {splitPayment
              ? 'Ambas partes se registrarán juntas y se reflejarán por separado en los totales de caja.'
              : 'El pago no puede superar el saldo pendiente y se registra con un identificador único para no duplicarse al reintentar.'}
          </p>
        )}
      </form>
    </Modal>
  )
}

function SplitPaymentSummary({
  balance,
  firstAmount,
  secondAmount,
}: {
  balance: number
  firstAmount: string
  secondAmount: string
}) {
  const first = parsePaymentAmount(firstAmount) ?? 0
  const second = parsePaymentAmount(secondAmount) ?? 0
  const total = Math.round((first + second) * 100) / 100
  const difference = Math.round((balance - total) * 100) / 100

  return (
    <div className="sm:col-span-2 grid grid-cols-2 gap-3 border-t border-primary/15 pt-3 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Total distribuido</p>
        <p className="mt-1 font-semibold tabular-nums">
          {currencyFormatter.format(total)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Saldo posterior</p>
        <p
          className={`mt-1 font-semibold tabular-nums ${difference < 0 ? 'text-red-600' : 'text-emerald-700'}`}
        >
          {currencyFormatter.format(difference)}
        </p>
      </div>
    </div>
  )
}
