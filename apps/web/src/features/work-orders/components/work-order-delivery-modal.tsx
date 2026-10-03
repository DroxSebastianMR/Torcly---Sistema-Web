import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState } from 'react-hook-form'
import { CarFront } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useWorkOrdersMutations } from '../hooks/use-work-orders'
import {
  workOrderDeliverySchema,
  type WorkOrderDeliveryFormValues,
} from '../forms/work-order.schema'
import type { WorkOrderDetail } from '../types/work-orders.types'
import { getWorkOrderErrorMessage } from '../utils/work-order-formatters'

interface WorkOrderDeliveryModalProps {
  open: boolean
  order: WorkOrderDetail | null
  onClose: () => void
}

export function WorkOrderDeliveryModal({
  open,
  order,
  onClose,
}: WorkOrderDeliveryModalProps) {
  const mutations = useWorkOrdersMutations()
  const form = useForm<WorkOrderDeliveryFormValues>({
    resolver: zodResolver(workOrderDeliverySchema),
    defaultValues: { notes: '' },
  })
  const { reset, register, trigger } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.deliver.isPending

  useEffect(() => {
    if (open) reset({ notes: '' })
  }, [open, reset])

  const closeModal = () => {
    if (busy) return
    reset({ notes: '' })
    onClose()
  }

  const submit = async () => {
    const valid = await trigger()
    if (!valid) {
      toast.error('Revisa las notas de entrega.')
      return
    }
    if (!order) return
    const notes = form.getValues('notes').trim()
    try {
      await mutations.deliver.mutateAsync({
        id: order.id,
        input: { ...(notes ? { notes } : {}) },
      })
      toast.success('Entrega registrada correctamente.')
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
      title="Registrar entrega"
      description={
        order
          ? `El vehículo de la orden ${order.code} será entregado al cliente.`
          : undefined
      }
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Registrando…' : 'Registrar entrega'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="delivery-notes"
            className="text-sm font-medium text-foreground"
          >
            Notas de entrega
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </label>
          <textarea
            id="delivery-notes"
            aria-label="Notas de la entrega"
            rows={4}
            placeholder="Ej. Entregado con las llaves y la ficha de servicio…"
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
          <CarFront aria-hidden size={14} className="mt-0.5 shrink-0" />
          Al entregar, la orden queda cerrada y pasa al historial técnico del
          vehículo.
        </p>
      </form>
    </Modal>
  )
}
