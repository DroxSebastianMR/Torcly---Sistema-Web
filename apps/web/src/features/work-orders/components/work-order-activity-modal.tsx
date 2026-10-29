import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useFormState } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
  const { reset, register, trigger, control } = form
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
          <Controller
            control={control}
            name="occurredAt"
            render={({ field }) => (
              <DatePicker
                id="activity-occurred-at"
                aria-label="Fecha de ejecución de la actividad"
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Seleccionar fecha"
              />
            )}
          />
        </div>
      </div>
    </Modal>
  )
}
