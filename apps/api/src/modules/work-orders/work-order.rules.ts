import { AppError } from '../../shared/errors/app-error.js'
import type { WorkOrderStatus } from './work-order.types.js'

export const BUDGET_EDITABLE_STATUSES: readonly WorkOrderStatus[] = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
]

export const TECHNICIAN_EDITABLE_STATUSES: readonly WorkOrderStatus[] = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
  'APROBADA',
]

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function computeWorkOrderTotals(
  lines: ReadonlyArray<{ unitPrice: unknown; quantity: unknown }>,
): { subtotal: number; total: number } {
  const subtotal = roundMoney(
    lines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * Number(line.quantity),
      0,
    ),
  )
  return { subtotal, total: subtotal }
}

export function assertHasLines(lines: ReadonlyArray<unknown>): void {
  if (lines.length === 0) {
    throw new AppError(
      400,
      'WORK_ORDER_NO_LINES',
      'Agrega al menos un producto o servicio al presupuesto.',
    )
  }
}

export function assertAppointmentAttendable(appointment: {
  code: string
  status: string
}): void {
  if (appointment.status !== 'PROGRAMADA') {
    throw new AppError(
      409,
      'APPOINTMENT_NOT_ATTENDABLE',
      `La cita ${appointment.code} no está programada y no puede atenderse.`,
    )
  }
}

export function assertBudgetEditable(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertStatusIn(
    order,
    BUDGET_EDITABLE_STATUSES,
    'diagnóstico y el presupuesto solo se pueden editar hasta que la orden espera la decisión del cliente.',
  )
}

export function assertTechnicianEditable(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertStatusIn(
    order,
    TECHNICIAN_EDITABLE_STATUSES,
    'el técnico ya no puede modificarse en esta orden.',
  )
}

export function assertCanDecide(order: {
  code: string
  status: WorkOrderStatus
  budgetSentAt: Date | null
}): void {
  if (order.status !== 'PENDIENTE_APROBACION' || !order.budgetSentAt) {
    throw new AppError(
      409,
      'WORK_ORDER_BUDGET_NOT_SENT',
      `La orden ${order.code} no tiene un presupuesto enviado pendiente de decisión.`,
    )
  }
}

export function shouldMoveToDiagnosis(
  status: WorkOrderStatus,
): WorkOrderStatus {
  return status === 'RECEPCIONADA' ? 'EN_DIAGNOSTICO' : status
}

function assertStatusIn(
  order: { code: string; status: WorkOrderStatus },
  allowed: readonly WorkOrderStatus[],
  message: string,
): void {
  if (!allowed.includes(order.status)) {
    throw new AppError(
      409,
      'WORK_ORDER_STATUS_INVALID',
      `La orden ${order.code} no permite esta acción: ${message}`,
    )
  }
}
