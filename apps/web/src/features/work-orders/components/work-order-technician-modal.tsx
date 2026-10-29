import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { useQuery } from '@tanstack/react-query'
import { workOrderKeys, useWorkOrdersMutations } from '../hooks/use-work-orders'
import { workOrdersService } from '../services/work-orders.service'
import type { WorkOrderDetail } from '../types/work-orders.types'
import { getWorkOrderErrorMessage } from '../utils/work-order-formatters'

interface WorkOrderTechnicianModalProps {
  open: boolean
  order: WorkOrderDetail | null
  onClose: () => void
}

export function WorkOrderTechnicianModal({
  open,
  order,
  onClose,
}: WorkOrderTechnicianModalProps) {
  if (!order) {
    return (
      <Modal open={open} onClose={onClose} title="Asignar técnico">
        <div
          className="h-24 animate-pulse rounded-xl bg-muted"
          aria-label="Cargando técnicos"
        />
      </Modal>
    )
  }
  return (
    <TechnicianForm
      key={order.id}
      open={open}
      order={order}
      onClose={onClose}
    />
  )
}

function TechnicianForm({
  open,
  order,
  onClose,
}: {
  open: boolean
  order: WorkOrderDetail
  onClose: () => void
}) {
  const [technicianId, setTechnicianId] = useState(order.technicianId ?? '')
  const mutations = useWorkOrdersMutations()
  const busy = mutations.assignTechnician.isPending
  const technicians = useQuery({
    queryKey: [...workOrderKeys.all, 'technicians'],
    queryFn: ({ signal }) => workOrdersService.technicians(signal),
    select: (response) => response.data,
  })

  const options = useMemo<SmartSelectOption[]>(() => {
    const list: SmartSelectOption[] = (technicians.data ?? []).map(
      (technician) => ({
        value: technician.id,
        label: technician.displayName,
      }),
    )
    if (technicianId && !list.some((option) => option.value === technicianId)) {
      list.unshift({ value: technicianId, label: 'Técnico no disponible' })
    }
    return [{ value: '', label: 'Sin técnico asignado' }, ...list]
  }, [technicians.data, technicianId])

  const closeModal = () => {
    if (busy) return
    onClose()
  }

  const save = async () => {
    try {
      await mutations.assignTechnician.mutateAsync({
        id: order.id,
        technicianId: technicianId || null,
      })
      toast.success(
        technicianId
          ? 'Técnico asignado a la orden.'
          : 'Se liberó el técnico de la orden.',
      )
      closeModal()
    } catch (error) {
      toast.error(getWorkOrderErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Asignar técnico"
      description={`El técnico se asigna a la orden ${order.code}.`}
      className="max-w-xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? 'Guardando…' : 'Asignar técnico'}
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        <label htmlFor="technician" className="text-sm font-medium">
          Técnico
        </label>
        <SmartSelect
          value={technicianId}
          aria-label="Técnico de la orden"
          placeholder="Seleccionar técnico"
          searchPlaceholder="Buscar técnico…"
          emptyMessage="Sin técnicos activos para asignar."
          options={options}
          disabled={busy || technicians.isPending}
          onChange={setTechnicianId}
        />
      </div>
    </Modal>
  )
}
