import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { PackageMinus } from 'lucide-react'
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
  workOrderConsumptionSchema,
  type WorkOrderConsumptionFormValues,
} from '../forms/work-order.schema'
import type {
  WorkOrderDetail,
  WorkOrderExecution,
} from '../types/work-orders.types'
import {
  getWorkOrderErrorMessage,
  quantityFormatter,
} from '../utils/work-order-formatters'

interface WorkOrderConsumptionModalProps {
  open: boolean
  order: WorkOrderDetail | null
  execution: WorkOrderExecution | null
  onClose: () => void
}

export function WorkOrderConsumptionModal({
  open,
  order,
  execution,
  onClose,
}: WorkOrderConsumptionModalProps) {
  const mutations = useWorkOrdersMutations()
  const [selectedLineId, setSelectedLineId] = useState('')
  const form = useForm<WorkOrderConsumptionFormValues>({
    resolver: zodResolver(workOrderConsumptionSchema),
    defaultValues: { lineId: '', quantity: 1 },
  })
  const { reset, getValues, trigger, setValue } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.consume.isPending
  const quantity = useWatch({ control: form.control, name: 'quantity' })

  const options = useMemo<SmartSelectOption[]>(
    () =>
      (execution?.productLines ?? [])
        .filter((line) => line.pending > 0)
        .map((line) => ({
          value: line.lineId,
          label: `${line.name} · ${line.code}`,
          meta: `Pendiente: ${quantityFormatter.format(line.pending)}${
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
    if (open) reset({ lineId: '', quantity: 1 })
  }, [open, reset])

  const closeModal = () => {
    if (busy) return
    reset({ lineId: '', quantity: 1 })
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
    if (requested > selectedLine.pending) {
      toast.error(
        `La cantidad supera el ptes. por consumir (${quantityFormatter.format(
          selectedLine.pending,
        )}).`,
      )
      return
    }
    try {
      await mutations.consume.mutateAsync({
        id: order.id,
        input: {
          requestId: crypto.randomUUID(),
          items: [{ lineId: selectedLineId, quantity: requested }],
        },
      })
      toast.success('Consumo registrado correctamente.')
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
      title="Consumir repuestos"
      description={
        order
          ? `Registra la salida de inventario para la orden ${order.code}.`
          : undefined
      }
      className="max-w-lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Registrando…' : 'Registrar consumo'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="consumption-line"
            className="text-sm font-medium text-foreground"
          >
            Repuesto
          </label>
          <SmartSelect
            value={selectedLineId}
            aria-label="Repuesto a consumir"
            placeholder="Seleccionar repuesto"
            searchPlaceholder="Buscar repuesto…"
            emptyMessage="No hay repuestos pendientes por consumir."
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
            Disponible del presupuesto:{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {quantityFormatter.format(selectedLine.pending)}
              {selectedLine.unitLabel ? ` ${selectedLine.unitLabel}` : ''}
            </span>
          </p>
        )}
        <div className="space-y-2">
          <label
            htmlFor="consumption-quantity"
            className="text-sm font-medium text-foreground"
          >
            Cantidad
          </label>
          <Input
            id="consumption-quantity"
            aria-label="Cantidad a consumir"
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
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <PackageMinus aria-hidden size={14} className="mt-0.5 shrink-0" />
          Cada envío es idempotente: si lo repites, no se duplicará la salida de
          inventario.
        </p>
      </form>
    </Modal>
  )
}
