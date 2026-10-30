import { BadgeDollarSign, PackageCheck, Wrench } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import { TrendChart } from '../trend-chart'
import type { ServicesBlockData } from '../../types/reports.types'
import {
  formatAmount,
  formatCount,
  formatQuantity,
} from '../../utils/report-formatters'

export function ServicesBlockContent({ data }: { data: ServicesBlockData }) {
  const isEmpty = data.metrics.serviceCount === 0
  if (isEmpty) {
    return (
      <EmptyState
        className="min-h-44"
        title="Sin servicios en el período"
        description="No hay líneas de servicio de ventas confirmadas en el rango consultado."
      />
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Servicios"
          value={formatCount(data.metrics.serviceCount)}
          hint="Distintos en el período"
          icon={<Wrench className="size-4" />}
          tone="purple"
        />
        <IndicatorCard
          label="Unidades vendidas"
          value={formatQuantity(data.metrics.unitsSold)}
          icon={<PackageCheck className="size-4" />}
          tone="cyan"
        />
        <IndicatorCard
          label="Importe"
          value={formatAmount(data.metrics.amount)}
          hint={`Promedio por unidad: ${formatAmount(data.metrics.averagePerUnit)}`}
          icon={<BadgeDollarSign className="size-4" />}
          tone="amber"
        />
      </div>
      <TrendChart
        data={data.trend}
        type="area"
        title="Tendencia de servicios"
        ariaLabel="Tendencia de importe de servicios del período"
        series={[
          {
            key: 'amount',
            label: 'Importe facturado',
            color: '#147357',
            formatter: formatAmount,
          },
        ]}
      />
      <ReportTable
        caption="Servicios más solicitados"
        rows={data.top.slice(0, 5)}
        ranked
        columns={[
          {
            key: 'name',
            header: 'Servicio',
            cell: (row) => (
              <span>
                {row.name} <span className="text-xs">({row.code})</span>
              </span>
            ),
          },
          {
            key: 'quantity',
            header: 'Cantidad',
            align: 'right',
            cell: (row) => formatQuantity(row.quantity),
          },
          {
            key: 'amount',
            header: 'Importe',
            align: 'right',
            cell: (row) => formatAmount(row.amount),
          },
        ]}
      />
    </div>
  )
}

export function ServicesBlockIcon() {
  return <Wrench aria-hidden className="size-5 text-primary" />
}
