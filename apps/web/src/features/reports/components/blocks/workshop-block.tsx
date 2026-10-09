import { Building2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { appointmentStatusLabel } from '@/features/appointments/utils/appointment-formatters'
import { workOrderStatusLabel } from '@/features/work-orders/utils/work-order-formatters'
import { BarChart } from '../bar-chart'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import type { WorkshopBlockData } from '../../types/reports.types'
import { formatCount, formatHours } from '../../utils/report-formatters'

const workOrderOrder = [
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
  'APROBADA',
  'RECHAZADA',
  'EN_EJECUCION',
  'LISTA_PARA_ENTREGA',
  'ENTREGADA',
] as const

const appointmentOrder = ['PROGRAMADA', 'CANCELADA', 'ATENDIDA'] as const

export function WorkshopBlockContent({ data }: { data: WorkshopBlockData }) {
  const isEmpty =
    data.metrics.workOrderCount === 0 && data.metrics.appointmentCount === 0
  const workOrders = workOrderOrder.map((status) => ({
    status,
    count: data.metrics.workOrdersByStatus[status] ?? 0,
  }))
  const appointments = appointmentOrder.map((status) => ({
    status,
    count: data.metrics.appointmentsByStatus[status] ?? 0,
  }))
  if (isEmpty) {
    return (
      <EmptyState
        className="min-h-44"
        title="Sin operación en el período"
        description="No hay órdenes de taller ni citas en el rango consultado."
      />
    )
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Órdenes de taller"
          value={formatCount(data.metrics.workOrderCount)}
        />
        <IndicatorCard
          label="Entregadas"
          value={formatCount(data.metrics.deliveredCount)}
        />
        <IndicatorCard
          label="Tiempo promedio"
          value={formatHours(data.metrics.averageDeliveryHours)}
          hint="Entre creación y entrega"
        />
        <IndicatorCard
          label="Citas"
          value={formatCount(data.metrics.appointmentCount)}
        />
      </div>
      <BarChart
        rows={data.trend.map((point) => ({
          key: point.bucket,
          label: point.label,
          count: point.count,
          amount: point.amount,
        }))}
        primary="count"
        label="Tendencia de taller"
        ariaLabel="Tendencia de órdenes y entregas del período"
        caption={`Tendencia de taller: ${data.period.from} a ${data.period.to}`}
        countLabel="Órdenes"
        amountLabel="Entregas"
        countFormatter={formatCount}
        amountFormatter={formatCount}
      />
      <ReportTable
        caption="Órdenes por etapa"
        rows={workOrders}
        emptyMessage="Sin órdenes en el período."
        columns={[
          {
            key: 'status',
            header: 'Etapa',
            cell: (row) => workOrderStatusLabel[row.status],
          },
          {
            key: 'count',
            header: 'Órdenes',
            align: 'right',
            cell: (row) => formatCount(row.count),
          },
        ]}
      />
      <ReportTable
        caption="Citas por estado"
        rows={appointments}
        emptyMessage="Sin citas en el período."
        columns={[
          {
            key: 'status',
            header: 'Estado',
            cell: (row) => appointmentStatusLabel(row.status),
          },
          {
            key: 'count',
            header: 'Citas',
            align: 'right',
            cell: (row) => formatCount(row.count),
          },
        ]}
      />
    </div>
  )
}

export function WorkshopBlockIcon() {
  return <Building2 aria-hidden className="size-5 text-primary" />
}
