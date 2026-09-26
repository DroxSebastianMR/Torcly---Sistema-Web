import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState } from 'react-hook-form'
import { Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useWorkOrdersMutations } from '../hooks/use-work-orders'
import {
  workOrderDiagnosisSchema,
  type WorkOrderDiagnosisFormValues,
} from '../forms/work-order.schema'
import type { WorkOrderDetail } from '../types/work-orders.types'
import { getWorkOrderErrorMessage } from '../utils/work-order-formatters'

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50'

interface WorkOrderDiagnosisModalProps {
  open: boolean
  order: WorkOrderDetail | null
  onClose: () => void
}

export function WorkOrderDiagnosisModal({
  open,
  order,
  onClose,
}: WorkOrderDiagnosisModalProps) {
  const mutations = useWorkOrdersMutations()
  const form = useForm<WorkOrderDiagnosisFormValues>({
    resolver: zodResolver(workOrderDiagnosisSchema),
    defaultValues: { diagnosis: '' },
  })
  const { reset, register, trigger } = form
  const formState = useFormState({ control: form.control })
  const busy = mutations.updateDiagnosis.isPending

  useEffect(() => {
    if (open) reset({ diagnosis: order?.diagnosis ?? '' })
  }, [open, order, reset])

  const closeModal = () => {
    if (busy) return
    reset({ diagnosis: '' })
    onClose()
  }

  const save = async () => {
    const valid = await trigger()
    if (!valid) {
      toast.error('Revisa el diagnóstico ingresado.')
      return
    }
    if (!order) return
    try {
      await mutations.updateDiagnosis.mutateAsync({
        id: order.id,
        diagnosis: form.getValues('diagnosis').trim(),
      })
      toast.success('Diagnóstico registrado correctamente.')
      closeModal()
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Registrar diagnóstico"
      description={
        order
          ? `La orden ${order.code} pasará a diagnóstico al guardar.`
          : undefined
      }
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? 'Guardando…' : 'Guardar diagnóstico'}
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <label
          htmlFor="diagnosis"
          className="text-sm font-medium text-foreground"
        >
          Diagnóstico
        </label>
        <textarea
          id="diagnosis"
          aria-label="Diagnóstico de la orden"
          rows={6}
          placeholder="Describe los hallazgos y el trabajo necesario…"
          {...register('diagnosis')}
          className={`${inputClass} h-auto w-full resize-y py-3`}
        />
        {formState.errors.diagnosis && (
          <p className="text-xs text-red-600">
            {formState.errors.diagnosis.message}
          </p>
        )}
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Info aria-hidden size={14} className="mt-0.5 shrink-0" />
          El diagnóstico queda registrado en la orden y habilita el registro del
          presupuesto.
        </p>
      </div>
    </Modal>
  )
}
