import { Hammer, PackageOpen, Wrench } from 'lucide-react'
import type { WorkOrderExecution } from '../types/work-orders.types'
import {
  dateTimeFormatter,
  quantityFormatter,
  workOrderActivityStatusLabel,
} from '../utils/work-order-formatters'

interface WorkOrderExecutionPanelProps {
  execution: WorkOrderExecution | null
  loading: boolean
}

export function WorkOrderExecutionPanel({
  execution,
  loading,
}: WorkOrderExecutionPanelProps) {
  if (loading || !execution) {
    return (
      <div
        className="space-y-3 rounded-xl border border-border/80 bg-muted/40 p-4"
        aria-label="Cargando ejecución de la orden"
      >
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <PanelInfo
          label="Ejecución iniciada"
          value={
            execution.startedBy && execution.startedAt
              ? `${execution.startedBy} · ${dateTimeFormatter.format(
                  new Date(execution.startedAt),
                )}`
              : '—'
          }
        />
        <PanelInfo
          label="Lista para entrega"
          value={
            execution.readyForDeliveryAt
              ? dateTimeFormatter.format(new Date(execution.readyForDeliveryAt))
              : '—'
          }
        />
        <PanelInfo
          label="Entrega"
          value={
            execution.deliveredBy && execution.deliveredAt
              ? `${execution.deliveredBy} · ${dateTimeFormatter.format(
                  new Date(execution.deliveredAt),
                )}`
              : '—'
          }
        />
      </div>

      {execution.deliveryNotes && (
        <div className="rounded-xl border border-border/80 bg-teal-50/40 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-teal-800">
            Notas de entrega
          </p>
          <p className="mt-1 text-sm font-medium break-words">
            {execution.deliveryNotes}
          </p>
        </div>
      )}

      {execution.productLines.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-center gap-2 border-b bg-[#f8faf9] px-4 py-3">
            <PackageOpen size={15} className="text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Consumo de repuestos
            </p>
          </div>
          <div className="hidden divide-y md:block" />
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Repuesto</th>
                  <th className="px-4 py-2 text-right">Ppto.</th>
                  <th className="px-4 py-2 text-right">Con.</th>
                  <th className="px-4 py-2 text-right">Dev.</th>
                  <th className="px-4 py-2 text-right">Neto</th>
                  <th className="px-4 py-2 text-right">Pte.</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {execution.productLines.map((line) => (
                  <tr key={line.lineId}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{line.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {line.code}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {quantityFormatter.format(line.budgeted)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {quantityFormatter.format(line.consumed)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {quantityFormatter.format(line.returned)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {quantityFormatter.format(line.netConsumed)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {quantityFormatter.format(line.pending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y md:hidden">
            {execution.productLines.map((line) => (
              <div key={line.lineId} className="px-4 py-3">
                <p className="font-medium">{line.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {line.code}
                </p>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <MiniStat label="Ppto." value={line.budgeted} />
                  <MiniStat label="Con." value={line.consumed} />
                  <MiniStat label="Neto" value={line.netConsumed} emphasis />
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b bg-[#f8faf9] px-4 py-3">
          <Hammer size={15} className="text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actividades registradas
          </p>
          <span className="ml-auto text-xs text-muted-foreground">
            {execution.activities.length}{' '}
            {execution.activities.length === 1 ? 'actividad' : 'actividades'}
          </span>
        </div>
        {execution.activities.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Aún no se registran actividades.
          </p>
        ) : (
          <ul className="divide-y">
            {execution.activities.map((activity) => (
              <li key={activity.id} className="flex gap-3 px-4 py-3">
                <Wrench
                  aria-hidden
                  size={16}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 text-sm font-medium break-words">
                      {activity.description}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        activity.status === 'COMPLETADA'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {workOrderActivityStatusLabel[activity.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.performedBy} ·{' '}
                    {dateTimeFormatter.format(new Date(activity.occurredAt))}
                    {activity.completedAt
                      ? ` · completada ${dateTimeFormatter.format(
                          new Date(activity.completedAt),
                        )}`
                      : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function PanelInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  )
}

function MiniStat({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${emphasis ? 'font-semibold' : ''}`}>
        {quantityFormatter.format(value)}
      </dd>
    </div>
  )
}
