import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { PackagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useWorkOrdersMutations } from '../hooks/use-work-orders'
import {
  workOrderReturnSchema,
  type WorkOrderReturnFormValues,
} from '../forms/work-order.schema'
import type {
  WorkOrderDetail,
  WorkOrderExecution,
} from '../types/work-orders.types'
import {
  getWorkOrderErrorMessage,
  quantityFormatter,
} from '../utils/work-order-formatters'

interface WorkOrderReturnModalProps {
  open: boolean
  order: WorkOrderDetail | null
  execution: WorkOrderExecution | null
  onClose: () => void
}

export function WorkOrderReturnModal({
  open,
  order,
  execution,
  onClose,
}: WorkOrderReturnModalProps) {
  const mutations = useWorkOrdersMutations()
  const [selectedLineId, setSelectedLineId] = useState('')
  const form = useForm<WorkOrderReturnFormValues>({
    resolver: zodResolver(workOrderReturnSchema),
    defaultValues: { lineId: '', quantity: 1, notes: '' },
  })
  const { reset, getValues, trigger, setValue, register } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.returnProducts.isPending
  const quantity = useWatch({ control: form.control, name: 'quantity' })

  const options = useMemo<SmartSelectOption[]>(
    () =>
      (execution?.productLines ?? [])
        .filter((line) => line.netConsumed > 0)
        .map((line) => ({
          value: line.lineId,
          label: `${line.name} · ${line.code}`,
          meta: `Consumido: ${quantityFormatter.format(line.netConsumed)}${
            line.unitLabel ? ` ${line.unitLabel}` : ''
          }`,
          searchTerms: [line.code, line.name],
        })),
    [execution?.productLines],
  )

  const selectedLine = useMemo(
    () =>
      execution?.productLines.find((line) => line.lineId === selectedLineId) ??
      null,
    [execution?.productLines, selectedLineId],
  )

  useEffect(() => {
    if (open) reset({ lineId: '', quantity: 1, notes: '' })
  }, [open, reset])

  const closeModal = () => {
    if (busy) return
    reset({ lineId: '', quantity: 1, notes: '' })
    setSelectedLineId('')
    onClose()
  }

  const submit = async () => {
    const valid = await trigger()
    if (!valid) {
      toast.error('Selecciona un repuesto y una cantidad válida.')
      return
    }
    if (!order || !selectedLine) return
    const requested = Number(getValues('quantity'))
    if (requested > selectedLine.netConsumed) {
      toast.error(
        `La devolución supera lo consumido (${quantityFormatter.format(
          selectedLine.netConsumed,
        )}).`,
      )
      return
    }
    const notes = getValues('notes').trim()
    try {
      await mutations.returnProducts.mutateAsync({
        id: order.id,
        input: {
          requestId: crypto.randomUUID(),
          items: [
            {
              lineId: selectedLineId,
              quantity: requested,
              ...(notes ? { notes } : {}),
            },
          ],
        },
      })
      toast.success('Devolución registrada correctamente.')
      closeModal()
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
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
      title="Devolver repuestos"
      description={
        order
          ? `Compensa el inventario con lo no utilizado en la orden ${order.code}.`
          : undefined
      }
      className="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Registrando…' : 'Registrar devolución'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="return-line"
            className="text-sm font-medium text-foreground"
          >
            Repuesto
          </label>
          <SmartSelect
            value={selectedLineId}
            aria-label="Repuesto a devolver"
            placeholder="Seleccionar repuesto"
            searchPlaceholder="Buscar repuesto…"
            emptyMessage="No hay repuestos consumidos para devolver."
            options={options}
            disabled={busy}
            onChange={(lineId) => {
              setSelectedLineId(lineId)
              setValue('lineId', lineId)
            }}
          />
          {formState.errors.lineId && (
            <p className="text-xs text-red-600">
              {formState.errors.lineId.message}
            </p>
          )}
        </div>
        {selectedLine && (
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Consumido neto:{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {quantityFormatter.format(selectedLine.netConsumed)}
              {selectedLine.unitLabel ? ` ${selectedLine.unitLabel}` : ''}
            </span>
          </p>
        )}
        <div className="space-y-2">
          <label
            htmlFor="return-quantity"
            className="text-sm font-medium text-foreground"
          >
            Cantidad
          </label>
          <Input
            id="return-quantity"
            aria-label="Cantidad a devolver"
            type="number"
            min="0.001"
            step="0.001"
            value={String(quantity)}
            onChange={(event) =>
              setValue('quantity', Number(event.target.value))
            }
          />
          {formState.errors.quantity && (
            <p className="text-xs text-red-600">
              {formState.errors.quantity.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="return-notes"
            className="text-sm font-medium text-foreground"
          >
            Motivo
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            id="return-notes"
            aria-label="Motivo de la devolución"
            rows={3}
            placeholder="Ej. Repuesto sobrante, cliente cambió de decisión…"
            {...register('notes')}
            className="h-auto w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          />
          {formState.errors.notes && (
            <p className="text-xs text-red-600">
              {formState.errors.notes.message}
            </p>
          )}
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <PackagePlus aria-hidden size={14} className="mt-0.5 shrink-0" />
          La devolución genera una entrada de ajuste en inventario; repetir el
          envío no la duplica.
        </p>
      </form>
    </Modal>
  )
}
