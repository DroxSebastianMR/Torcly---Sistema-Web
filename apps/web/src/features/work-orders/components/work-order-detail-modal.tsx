import {
  BadgeCheck,
  CarFront,
  CircleCheck,
  ClipboardList,
  PackageMinus,
  PackagePlus,
  Stethoscope,
  UserRound,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type {
  WorkOrderDetail,
  WorkOrderExecution,
  WorkOrderLine,
} from '../types/work-orders.types'
import {
  canDeliverWorkOrder,
  canFinalizeWorkOrder,
  canManageWorkOrderExecution,
  canStartWorkOrderExecution,
  currencyFormatter,
  dateTimeFormatter,
  isWorkOrderBudgetEditable,
  isWorkOrderTechnicianEditable,
  quantityFormatter,
  workOrderStatusLabel,
} from '../utils/work-order-formatters'
import { WorkOrderExecutionPanel } from './work-order-execution-panel'

interface WorkOrderDetailModalProps {
  open: boolean
  order: WorkOrderDetail | null
  loading: boolean
  canEdit: boolean
  execution: WorkOrderExecution | null
  executionLoading: boolean
  onClose: () => void
  onDiagnosis: (order: WorkOrderDetail) => void
  onBudget: (order: WorkOrderDetail) => void
  onDecide: (order: WorkOrderDetail) => void
  onTechnician: (order: WorkOrderDetail) => void
  onStartExecution: (order: WorkOrderDetail) => void
  onActivity: (order: WorkOrderDetail) => void
  onConsume: (order: WorkOrderDetail) => void
  onReturn: (order: WorkOrderDetail) => void
  onFinalize: (order: WorkOrderDetail) => void
  onDeliver: (order: WorkOrderDetail) => void
}

export function WorkOrderDetailModal({
  open,
  order,
  loading,
  canEdit,
  execution,
  executionLoading,
  onClose,
  onDiagnosis,
  onBudget,
  onDecide,
  onTechnician,
  onStartExecution,
  onActivity,
  onConsume,
  onReturn,
  onFinalize,
  onDeliver,
}: WorkOrderDetailModalProps) {
  const canStart = Boolean(
    order &&
      canEdit &&
      canStartWorkOrderExecution(order.status, Boolean(order.technician)),
  )
  const inExecution = Boolean(
    order && canEdit && canManageWorkOrderExecution(order.status),
  )
  const canFinalize = Boolean(
    order && canEdit && canFinalizeWorkOrder(order.status),
  )
  const canDeliver = Boolean(
    order && canEdit && canDeliverWorkOrder(order.status),
  )
  const showExecution =
    Boolean(order) &&
    (order?.status === 'EN_EJECUCION' ||
      order?.status === 'LISTA_PARA_ENTREGA' ||
      order?.status === 'ENTREGADA')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order?.code ?? 'Detalle de orden de taller'}
      description={
        order
          ? `Orden ${workOrderStatusLabel[order.status].toLowerCase()}`
          : undefined
      }
      className="max-w-4xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {canStart && order && (
            <Button type="button" onClick={() => onStartExecution(order)}>
              <Wrench size={16} /> Iniciar ejecución
            </Button>
          )}
          {inExecution && order && (
            <Button type="button" onClick={() => onActivity(order)}>
              <ClipboardList size={16} /> Registrar actividad
            </Button>
          )}
          {inExecution && order && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onConsume(order)}
            >
              <PackageMinus size={16} /> Consumir repuestos
            </Button>
          )}
          {inExecution && order && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onReturn(order)}
            >
              <PackagePlus size={16} /> Devolver repuestos
            </Button>
          )}
          {canFinalize && order && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onFinalize(order)}
            >
              <BadgeCheck size={16} /> Finalizar orden
            </Button>
          )}
          {canDeliver && order && (
            <Button type="button" onClick={() => onDeliver(order)}>
              <CarFront size={16} /> Registrar entrega
            </Button>
          )}
          {order && canEdit && order.status === 'RECEPCIONADA' && (
            <Button type="button" onClick={() => onDiagnosis(order)}>
              <Stethoscope size={16} /> Registrar diagnóstico
            </Button>
          )}
          {order && canEdit && order.status === 'EN_DIAGNOSTICO' && (
            <Button type="button" onClick={() => onBudget(order)}>
              <ClipboardList size={16} /> Registrar presupuesto
            </Button>
          )}
          {order && canEdit && order.status === 'PENDIENTE_APROBACION' && (
            <Button type="button" onClick={() => onDecide(order)}>
              <CircleCheck size={16} /> Registrar decisión
            </Button>
          )}
          {order &&
            order.status !== 'RECEPCIONADA' &&
            isWorkOrderBudgetEditable(order.status) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onBudget(order)}
              >
                <ClipboardList size={16} /> Editar presupuesto
              </Button>
            )}
          {order && isWorkOrderTechnicianEditable(order.status) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onTechnician(order)}
            >
              <UserRound size={16} /> Asignar técnico
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {loading || !order ? (
        <DetailSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={<ClipboardList aria-hidden size={15} />}
              label="Cita de origen"
              value={order.appointment.code}
            />
            <InfoItem
              label="Estado"
              value={workOrderStatusLabel[order.status]}
            />
            <InfoItem
              label="Cliente"
              value={`${order.customer.name} · ${order.customer.documentNumber}`}
            />
            <InfoItem
              label="Vehículo"
              value={
                order.vehicle.plate
                  ? `${order.vehicle.plate} · ${order.vehicle.brand} ${order.vehicle.model} (${order.vehicle.year})`
                  : `${order.vehicle.brand} ${order.vehicle.model} (${order.vehicle.year})`
              }
            />
            <InfoItem label="Registrada por" value={order.performedBy} />
            <InfoItem
              label="Técnico"
              value={order.technician ?? 'Sin asignar'}
            />
          </div>

          {order.diagnosis && (
            <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Diagnóstico
              </p>
              <p className="mt-1 text-sm font-medium break-words">
                {order.diagnosis}
              </p>
              {order.diagnosisUpdatedBy && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Actualizado por {order.diagnosisUpdatedBy} ·{' '}
                  {dateTimeFormatter.format(
                    new Date(order.diagnosisUpdatedAt!),
                  )}
                </p>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border">
            <div className="hidden divide-y md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.lines.map((line) => (
                    <LineRow key={line.id} line={line} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y md:hidden">
              {order.lines.map((line) => (
                <LineCard key={line.id} line={line} />
              ))}
            </div>
            <div className="flex items-center justify-between border-t bg-[#f8faf9] px-4 py-3 text-sm">
              <span className="font-medium text-muted-foreground">
                {order.lineCount} {order.lineCount === 1 ? 'línea' : 'líneas'}
              </span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold tabular-nums text-brand-forest">
                  {currencyFormatter.format(order.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {order.budgetSentAt && (
              <InfoItem
                label="Presupuesto enviado"
                value={dateTimeFormatter.format(new Date(order.budgetSentAt))}
              />
            )}
            {order.approvedAt && (
              <InfoItem
                label="Aprobada"
                value={
                  order.approvedBy
                    ? `${order.approvedBy} · ${dateTimeFormatter.format(
                        new Date(order.approvedAt),
                      )}`
                    : dateTimeFormatter.format(new Date(order.approvedAt))
                }
              />
            )}
            {order.rejectedAt && (
              <InfoItem
                label="Rechazada"
                value={
                  order.rejectedBy
                    ? `${order.rejectedBy} · ${dateTimeFormatter.format(
                        new Date(order.rejectedAt),
                      )}`
                    : dateTimeFormatter.format(new Date(order.rejectedAt))
                }
              />
            )}
          </div>
          {order.decisionNotes && (
            <div className="rounded-xl border border-border/80 bg-amber-50/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-800">
                Observaciones de la decisión
              </p>
              <p className="mt-1 text-sm font-medium break-words">
                {order.decisionNotes}
              </p>
            </div>
          )}

          {showExecution && (
            <WorkOrderExecutionPanel
              execution={execution}
              loading={executionLoading}
            />
          )}
        </div>
      )}
    </Modal>
  )
}

function LineRow({ line }: { line: WorkOrderLine }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium">{line.name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {line.code}
        </p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {currencyFormatter.format(line.unitPrice)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {quantityFormatter.format(line.quantity)}
        {line.unitLabel ? ` ${line.unitLabel}` : ''}
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">
        {currencyFormatter.format(line.subtotal)}
      </td>
    </tr>
  )
}

function LineCard({ line }: { line: WorkOrderLine }) {
  return (
    <div className="px-4 py-3">
      <p className="font-medium">{line.name}</p>
      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
        {line.code}
      </p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {currencyFormatter.format(line.unitPrice)} ×{' '}
          {quantityFormatter.format(line.quantity)}
          {line.unitLabel ? ` ${line.unitLabel}` : ''}
        </span>
        <span className="font-semibold tabular-nums">
          {currencyFormatter.format(line.subtotal)}
        </span>
      </div>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando orden de taller">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-12 w-40 animate-pulse self-end rounded-xl bg-muted" />
    </div>
  )
}
