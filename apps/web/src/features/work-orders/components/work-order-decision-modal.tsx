import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useWorkOrdersMutations } from '../hooks/use-work-orders'
import {
  workOrderDecisionSchema,
  type WorkOrderDecisionFormValues,
} from '../forms/work-order.schema'
import type { WorkOrderDetail } from '../types/work-orders.types'
import {
  currencyFormatter,
  getWorkOrderErrorMessage,
} from '../utils/work-order-formatters'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

interface WorkOrderDecisionModalProps {
  open: boolean
  order: WorkOrderDetail | null
  onClose: () => void
}

export function WorkOrderDecisionModal({
  open,
  order,
  onClose,
}: WorkOrderDecisionModalProps) {
  const mutations = useWorkOrdersMutations()
  const form = useForm<WorkOrderDecisionFormValues>({
    resolver: zodResolver(workOrderDecisionSchema),
    defaultValues: { decision: 'APPROVED', notes: '' },
  })
  const { reset, register, trigger, setValue } = form
  const formState = useFormState({ control: form.control })
  const decision = useWatch({ control: form.control, name: 'decision' })
  const busy = mutations.decide.isPending

  useEffect(() => {
    if (open) reset({ decision: 'APPROVED', notes: '' })
  }, [open, reset])

  const closeModal = () => {
    if (busy) return
    reset({ decision: 'APPROVED', notes: '' })
    onClose()
  }

  const decisionOptions = useMemo<SmartSelectOption[]>(
    () => [
      { value: 'APPROVED', label: 'Cliente aprobó el presupuesto' },
      { value: 'REJECTED', label: 'Cliente rechazó el presupuesto' },
    ],
    [],
  )

  const save = async () => {
    const valid = await trigger()
    if (!valid) {
      toast.error('Revisa la decisión registrada.')
      return
    }
    if (!order) return
    try {
      const values = form.getValues()
      await mutations.decide.mutateAsync({
        id: order.id,
        input: {
          decision: values.decision,
          notes: values.notes.trim() || undefined,
        },
      })
      toast.success(
        values.decision === 'APPROVED'
          ? 'Presupuesto aprobado por el cliente.'
          : 'Presupuesto rechazado por el cliente.',
      )
      closeModal()
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
  }

  const rejected = decision === 'REJECTED'

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Registrar decisión del cliente"
      description={
        order ? `Presupuesto enviado de la orden ${order.code}.` : undefined
      }
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? 'Guardando…' : 'Registrar decisión'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {order && (
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Total del presupuesto
            </p>
            <p className="text-2xl font-bold tabular-nums text-brand-forest">
              {currencyFormatter.format(order.total)}
            </p>
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="decision" className="text-sm font-medium">
            Decisión del cliente
          </label>
          <SmartSelect
            value={decision}
            aria-label="Decisión del cliente"
            placeholder="Seleccionar decisión"
            options={decisionOptions}
            disabled={busy}
            onChange={(value) =>
              setValue('decision', value as 'APPROVED' | 'REJECTED')
            }
          />
        </div>
        {rejected && (
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Observaciones
            </label>
            <textarea
              id="notes"
              aria-label="Observaciones de la decisión"
              rows={4}
              placeholder="Motivo del rechazo (por ejemplo: precio, tiempo de entrega)…"
              {...register('notes')}
              className={`${inputClass} h-auto w-full resize-y py-3`}
            />
            {formState.errors.notes && (
              <p className="text-xs text-red-600">
                {formState.errors.notes.message}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
