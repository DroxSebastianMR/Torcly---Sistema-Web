import { isAxiosError } from 'axios'
import type { WorkOrderStatus } from '../types/work-orders.types'

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  RECEPCIONADA: 'Recepcionada',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PENDIENTE_APROBACION: 'Pte. aprobación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
}

const budgetEditableStatuses: WorkOrderStatus[] = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
]

const technicianEditableStatuses: WorkOrderStatus[] = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
  'APROBADA',
]

export function isWorkOrderBudgetEditable(status: WorkOrderStatus) {
  return budgetEditableStatuses.includes(status)
}

export function isWorkOrderTechnicianEditable(status: WorkOrderStatus) {
  return technicianEditableStatuses.includes(status)
}

export function canSendWorkOrderBudget(
  status: WorkOrderStatus,
  lineCount: number,
) {
  return budgetEditableStatuses.includes(status) && lineCount > 0
}

export function canDecideWorkOrder(status: WorkOrderStatus) {
  return status === 'PENDIENTE_APROBACION'
}

export function workOrderLineSubtotal(line: {
  unitPrice: number
  quantity: number
}) {
  return (
    Math.round((line.unitPrice * line.quantity + Number.EPSILON) * 100) / 100
  )
}

export function getWorkOrderErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}

export const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

export const quantityFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 3,
})

export const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
