import { AppError } from '../../shared/errors/app-error.js'
import type {
  WorkOrderConsumptionType,
  WorkOrderStatus,
} from './work-order.types.js'

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

export function assertCanStartExecution(order: {
  code: string
  status: WorkOrderStatus
  technicianId: string | null
}): void {
  if (order.status !== 'APROBADA') {
    throw new AppError(
      409,
      'WORK_ORDER_STATUS_INVALID',
      `La orden ${order.code} solo puede iniciar su ejecución cuando está aprobada.`,
    )
  }
  if (!order.technicianId) {
    throw new AppError(
      409,
      'WORK_ORDER_TECHNICIAN_REQUIRED',
      `Asigna un técnico a la orden ${order.code} antes de iniciar la ejecución.`,
    )
  }
}

export function assertCanRegisterActivity(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertExecutionRunning(order, 'registrar actividades')
}

export function assertCanCompleteActivity(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertExecutionRunning(order, 'completar actividades')
}

export function assertCanConsume(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertExecutionRunning(order, 'registrar consumos de repuestos')
}

export function assertCanReturn(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertExecutionRunning(order, 'registrar devoluciones de repuestos')
}

export function assertCanFinalize(order: {
  code: string
  status: WorkOrderStatus
}): void {
  assertExecutionRunning(order, 'finalizar la ejecución')
}

function assertExecutionRunning(
  order: { code: string; status: WorkOrderStatus },
  action: string,
): void {
  if (order.status !== 'EN_EJECUCION') {
    throw new AppError(
      409,
      'WORK_ORDER_STATUS_INVALID',
      `La orden ${order.code} solo permite ${action} mientras está en ejecución.`,
    )
  }
}

export function assertCanDeliver(order: {
  code: string
  status: WorkOrderStatus
}): void {
  if (order.status !== 'LISTA_PARA_ENTREGA') {
    throw new AppError(
      409,
      'WORK_ORDER_STATUS_INVALID',
      `La orden ${order.code} solo puede entregarse cuando está lista para entrega.`,
    )
  }
}

export function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

export function computeNetConsumed(
  consumptions: ReadonlyArray<{
    type: WorkOrderConsumptionType
    quantity: unknown
  }>,
): number {
  return consumptions.reduce((net, consumption) => {
    const quantity = Number(consumption.quantity)
    return consumption.type === 'CONSUMPTION' ? net + quantity : net - quantity
  }, 0)
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
