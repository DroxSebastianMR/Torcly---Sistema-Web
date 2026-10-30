import { Building2, CalendarDays, Clock3, PackageCheck } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { appointmentStatusLabel } from '@/features/appointments/utils/appointment-formatters'
import { workOrderStatusLabel } from '@/features/work-orders/utils/work-order-formatters'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import { CompositionChart } from '../composition-chart'
import { TrendChart } from '../trend-chart'
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
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Órdenes de taller"
          value={formatCount(data.metrics.workOrderCount)}
          icon={<Building2 className="size-4" />}
          tone="purple"
        />
        <IndicatorCard
          label="Entregadas"
          value={formatCount(data.metrics.deliveredCount)}
          icon={<PackageCheck className="size-4" />}
          tone="cyan"
        />
        <IndicatorCard
          label="Tiempo promedio"
          value={formatHours(data.metrics.averageDeliveryHours)}
          hint="Entre creación y entrega"
          icon={<Clock3 className="size-4" />}
          tone="amber"
        />
        <IndicatorCard
          label="Citas"
          value={formatCount(data.metrics.appointmentCount)}
          icon={<CalendarDays className="size-4" />}
          tone="red"
        />
      </div>
      <TrendChart
        data={data.trend}
        type="bar"
        title="Órdenes y entregas"
        ariaLabel="Tendencia de órdenes y entregas del período"
        series={[
          {
            key: 'ordersCreated',
            label: 'Órdenes creadas',
            color: '#147357',
            formatter: formatCount,
          },
          {
            key: 'delivered',
            label: 'Entregadas',
            color: '#2a79a5',
            formatter: formatCount,
          },
        ]}
      />
      <CompositionChart
        title="Órdenes por etapa"
        ariaLabel="Distribución de órdenes de taller por etapa"
        formatter={formatCount}
        rows={workOrders.map((row, index) => ({
          key: row.status,
          label: workOrderStatusLabel[row.status],
          value: row.count,
          color: ['#147357', '#2a79a5', '#c85d00', '#7758b5'][index % 4]!,
        }))}
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
