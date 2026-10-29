import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { runFormSchema, type RunFormValues } from '../forms/run.schema'
import {
  idempotencyKeyForRun,
  useCreateReplenishmentRun,
} from '../hooks/use-replenishment'
import type { ReplenishmentPeriod } from '../types/replenishment.types'
import {
  formatPeriodLabel,
  getReplenishmentErrorMessage,
} from '../utils/replenishment-formatters'

interface RunModalProps {
  open: boolean
  period: ReplenishmentPeriod
  coverageDays: number
  onClose: () => void
}

export function RunModal({
  open,
  period,
  coverageDays,
  onClose,
}: RunModalProps) {
  const createRun = useCreateReplenishmentRun()
  const form = useForm<RunFormValues>({
    resolver: zodResolver(runFormSchema),
    defaultValues: { coverageDays },
  })
  const { reset: resetForm } = form
  const periodLabel = useMemo(
    () => formatPeriodLabel(period.from, period.to),
    [period],
  )

  useEffect(() => {
    if (!open) return
    resetForm({ coverageDays })
  }, [open, resetForm, coverageDays])

  const submit = form.handleSubmit(async (values) => {
    try {
      const run = await createRun.mutateAsync({
        from: period.from,
        to: period.to,
        coverageDays: values.coverageDays,
        idempotencyKey: idempotencyKeyForRun(),
      })
      toast.success(`Corrida ${run.code} ejecutada correctamente.`)
      onClose()
    } catch (error) {
      toast.error(getReplenishmentErrorMessage(error))
    }
  })

  const fieldError = () => {
    const message = form.formState.errors.coverageDays?.message
    return message ? String(message) : undefined
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ejecutar corrida de reabastecimiento"
      description="Se calcula la recomendación determinista para todos los productos y se registra con auditoría."
      className="max-w-xl"
      visual={
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PackagePlus aria-hidden size={18} />
        </span>
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="run-form" disabled={createRun.isPending}>
            {createRun.isPending ? 'Ejecutando…' : 'Ejecutar corrida'}
          </Button>
        </div>
      }
    >
      <div className="mb-5 rounded-xl bg-muted/70 px-4 py-3 text-sm leading-5 text-muted-foreground">
        <p>
          Período:{' '}
          <span className="font-medium text-foreground">{periodLabel}</span> (
          {period.from} al {period.to}).
        </p>
        <p className="mt-1">
          La corrida solo registra la recomendación; no crea compras ni
          movimientos de stock.
        </p>
      </div>
      <form id="run-form" onSubmit={submit} noValidate className="space-y-5">
        <Field label="Cobertura objetivo (días)" error={fieldError()} required>
          <Input
            {...form.register('coverageDays', { valueAsNumber: true })}
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
          />
        </Field>
      </form>
    </Modal>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>
        {label}
        {required && <span className="ml-1 text-emerald-700">*</span>}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-normal text-red-600">{error}</span>
      ) : hint ? (
        <span className="block text-xs font-normal text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
