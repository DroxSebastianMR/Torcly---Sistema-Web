import { ClipboardList, MoreHorizontal, UserRound } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type {
  WorkOrderStatus,
  WorkOrderSummary,
} from '../types/work-orders.types'
import {
  currencyFormatter,
  workOrderStatusLabel,
} from '../utils/work-order-formatters'

interface WorkOrdersTableProps {
  orders: WorkOrderSummary[]
  loading: boolean
  onOpen: (order: WorkOrderSummary) => void
}

export function WorkOrdersTable({
  orders,
  loading,
  onOpen,
}: WorkOrdersTableProps) {
  if (loading) return <WorkOrdersSkeleton />

  if (!orders.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No se encontraron órdenes de taller"
        description="Ajusta los filtros o atiende la primera cita para crear una orden."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Orden</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="group cursor-pointer hover:bg-[#f9fbfa]"
                onClick={() => onOpen(order)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <ClipboardList size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {order.code}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cita {order.appointment.code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-48 px-4 py-4">
                  <p className="truncate">{order.customer.name}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {order.customer.documentNumber}
                  </p>
                </td>
                <td className="max-w-52 px-4 py-4">
                  <p className="truncate font-medium">
                    {order.vehicle.plate} · {order.vehicle.brand}{' '}
                    {order.vehicle.model}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.vehicle.year}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {order.technician ? (
                    <span className="flex items-center gap-1.5">
                      <UserRound className="size-3.5 text-muted-foreground" />
                      {order.technician}
                    </span>
                  ) : (
                    'Sin asignar'
                  )}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">
                  {currencyFormatter.format(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {orders.map((order) => (
          <article
            key={order.id}
            className="px-4 py-4"
            onClick={() => onOpen(order)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold">{order.code}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {order.customer.name} · {order.vehicle.plate}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {order.lineCount} {order.lineCount === 1 ? 'línea' : 'líneas'}
                {order.technician ? ` · ${order.technician}` : ''}
              </span>
              <span className="font-semibold tabular-nums">
                {currencyFormatter.format(order.total)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

const statusTone: Record<WorkOrderStatus, string> = {
  RECEPCIONADA: 'bg-stone-100 text-stone-700',
  EN_DIAGNOSTICO: 'bg-amber-50 text-amber-700',
  PENDIENTE_APROBACION: 'bg-sky-50 text-sky-700',
  APROBADA: 'bg-emerald-50 text-emerald-700',
  RECHAZADA: 'bg-rose-50 text-rose-700',
}

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}
    >
      {workOrderStatusLabel[status]}
    </span>
  )
}

function WorkOrdersSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando órdenes de taller">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-44 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
