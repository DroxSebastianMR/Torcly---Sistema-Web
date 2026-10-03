import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState } from 'react-hook-form'
import { Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useWorkOrdersMutations } from '../hooks/use-work-orders'
import {
  workOrderActivitySchema,
  type WorkOrderActivityFormValues,
} from '../forms/work-order.schema'
import type { WorkOrderDetail } from '../types/work-orders.types'
import { getWorkOrderErrorMessage } from '../utils/work-order-formatters'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

interface WorkOrderActivityModalProps {
  open: boolean
  order: WorkOrderDetail | null
  onClose: () => void
}

export function WorkOrderActivityModal({
  open,
  order,
  onClose,
}: WorkOrderActivityModalProps) {
  const mutations = useWorkOrdersMutations()
  const form = useForm<WorkOrderActivityFormValues>({
    resolver: zodResolver(workOrderActivitySchema),
    defaultValues: { description: '', occurredAt: '' },
  })
  const { reset, register, trigger } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.createActivity.isPending

  useEffect(() => {
    if (open) reset({ description: '', occurredAt: '' })
  }, [open, reset])

  const closeModal = () => {
    if (busy) return
    reset({ description: '', occurredAt: '' })
    onClose()
  }

  const save = async () => {
    const valid = await trigger()
    if (!valid) {
      toast.error('Revisa la actividad registrada.')
      return
    }
    if (!order) return
    const values = form.getValues()
    try {
      await mutations.createActivity.mutateAsync({
        id: order.id,
        input: {
          description: values.description.trim(),
          ...(values.occurredAt ? { occurredAt: values.occurredAt } : {}),
        },
      })
      toast.success('Actividad registrada correctamente.')
      closeModal()
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Registrar actividad"
      description={
        order
          ? `Añade la tarea realizada en la orden ${order.code}.`
          : undefined
      }
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? 'Guardando…' : 'Registrar actividad'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="activity-description"
            className="text-sm font-medium text-foreground"
          >
            Descripción
          </label>
          <textarea
            id="activity-description"
            aria-label="Descripción de la actividad"
            rows={4}
            placeholder="Describe la tarea realizada…"
            {...register('description')}
            className={`${inputClass} h-auto w-full resize-y py-3`}
          />
          {formState.errors.description && (
            <p className="text-xs text-red-600">
              {formState.errors.description.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="activity-occurred-at"
            className="text-sm font-medium text-foreground"
          >
            Fecha de ejecución
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (opcional, hoy si se omite)
            </span>
          </label>
          <Input
            id="activity-occurred-at"
            aria-label="Fecha de ejecución de la actividad"
            type="date"
            {...register('occurredAt')}
          />
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Info aria-hidden size={14} className="mt-0.5 shrink-0" />
          Las actividades quedan pendientes hasta que las completes desde la
          ficha de la orden.
        </p>
      </div>
    </Modal>
  )
}
