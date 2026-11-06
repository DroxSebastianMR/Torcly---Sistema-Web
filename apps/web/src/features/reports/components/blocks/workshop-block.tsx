import {
  Building2,
  CalendarDays,
  Car,
  Clock3,
  LogIn,
  PackageCheck,
} from 'lucide-react'
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
  const sources = [
    {
      source: 'WALK_IN',
      label: 'Ingreso directo (Walk-in)',
      count: data.metrics.walkInsCount ?? 0,
    },
    {
      source: 'APPOINTMENT',
      label: 'Con cita previa',
      count: data.metrics.appointmentOrdersCount ?? 0,
    },
  ]

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <IndicatorCard
          label="Vehículos ingresados"
          value={formatCount(data.metrics.workOrderCount)}
          hint="Total entradas al taller"
          icon={<LogIn className="size-4" />}
          tone="purple"
        />
        <IndicatorCard
          label="Ingresos directos"
          value={formatCount(data.metrics.walkInsCount ?? 0)}
          hint="Sin cita previa (Walk-in)"
          icon={<Car className="size-4" />}
          tone="cyan"
        />
        <IndicatorCard
          label="Ingresos con cita"
          value={formatCount(data.metrics.appointmentOrdersCount ?? 0)}
          hint="Citas previas atendidas"
          icon={<CalendarDays className="size-4" />}
          tone="amber"
        />
        <IndicatorCard
          label="Vehículos entregados"
          value={formatCount(data.metrics.deliveredCount)}
          hint="Salidas completadas"
          icon={<PackageCheck className="size-4" />}
          tone="purple"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <IndicatorCard
          label="Tiempo promedio en taller"
          value={formatHours(data.metrics.averageDeliveryHours)}
          hint="Desde recepción hasta entrega final"
          icon={<Clock3 className="size-4" />}
          tone="amber"
        />
        <IndicatorCard
          label="Citas registradas"
          value={formatCount(data.metrics.appointmentCount)}
          hint="En el calendario del período"
          icon={<Building2 className="size-4" />}
          tone="red"
        />
      </div>

      <TrendChart
        data={data.trend}
        type="bar"
        title="Flujo vehicular (Entradas vs Salidas)"
        ariaLabel="Tendencia de ingresos y entregas de vehículos del período"
        series={[
          {
            key: 'ordersCreated',
            label: 'Ingresos (Entradas)',
            color: '#147357',
            formatter: formatCount,
          },
          {
            key: 'delivered',
            label: 'Entregadas (Salidas)',
            color: '#2a79a5',
            formatter: formatCount,
          },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <CompositionChart
          title="Ingresos por origen de recepción"
          ariaLabel="Distribución de ingresos por directo vs cita"
          formatter={formatCount}
          rows={sources.map((row, index) => ({
            key: row.source,
            label: row.label,
            value: row.count,
            color: ['#147357', '#2a79a5'][index % 2]!,
          }))}
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ReportTable
          caption="Ingresos por origen"
          rows={sources}
          emptyMessage="Sin ingresos en el período."
          columns={[
            {
              key: 'label',
              header: 'Origen de recepción',
              cell: (row) => row.label,
            },
            {
              key: 'count',
              header: 'Vehículos',
              align: 'right',
              cell: (row) => formatCount(row.count),
            },
          ]}
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
      </div>

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
