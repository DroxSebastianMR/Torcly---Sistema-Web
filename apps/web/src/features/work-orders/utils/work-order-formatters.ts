import { isAxiosError } from 'axios'
import type {
  WorkOrderActivityStatus,
  WorkOrderStatus,
} from '../types/work-orders.types'

export const workOrderStatusLabel: Record<WorkOrderStatus, string> = {
  RECEPCIONADA: 'Recepcionada',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PENDIENTE_APROBACION: 'Pte. aprobación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  EN_EJECUCION: 'En ejecución',
  LISTA_PARA_ENTREGA: 'Pta. entrega',
  ENTREGADA: 'Entregada',
}

export const workOrderActivityStatusLabel: Record<
  WorkOrderActivityStatus,
  string
> = {
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',
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

export function canStartWorkOrderExecution(status: WorkOrderStatus) {
  return status === 'APROBADA'
}

export function canManageWorkOrderExecution(status: WorkOrderStatus) {
  return status === 'EN_EJECUCION'
}

export function canFinalizeWorkOrder(status: WorkOrderStatus) {
  return status === 'EN_EJECUCION'
}

export function canDeliverWorkOrder(status: WorkOrderStatus) {
  return status === 'LISTA_PARA_ENTREGA'
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

export function formatReceptionDateTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  } catch {
    return isoString
  }
}

export function getDateRangeFromPreset(
  preset: 'all' | 'today' | 'yesterday' | 'week' | 'month',
): {
  from?: string
  to?: string
} {
  const now = new Date()
  const toDateStr = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (preset === 'today') {
    const today = toDateStr(now)
    return { from: today, to: today }
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = toDateStr(yesterday)
    return { from: yStr, to: yStr }
  }

  if (preset === 'week') {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 6)
    return { from: toDateStr(weekStart), to: toDateStr(now) }
  }

  if (preset === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: toDateStr(monthStart), to: toDateStr(now) }
  }

  return { from: undefined, to: undefined }
}
