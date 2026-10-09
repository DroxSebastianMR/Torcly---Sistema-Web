import { Wrench } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { BarChart } from '../bar-chart'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Servicios"
          value={formatCount(data.metrics.serviceCount)}
          hint="Distintos en el período"
        />
        <IndicatorCard
          label="Unidades vendidas"
          value={formatQuantity(data.metrics.unitsSold)}
        />
        <IndicatorCard
          label="Importe"
          value={formatAmount(data.metrics.amount)}
          hint={`Promedio por unidad: ${formatAmount(data.metrics.averagePerUnit)}`}
        />
      </div>
      <BarChart
        rows={data.trend.map((point) => ({
          key: point.bucket,
          label: point.label,
          count: point.count,
          amount: point.amount,
        }))}
        primary="amount"
        label="Tendencia de servicios"
        ariaLabel="Tendencia de importe de servicios del período"
        caption={`Tendencia de servicios: ${data.period.from} a ${data.period.to}`}
        countLabel="Unidades"
        amountLabel="Importe"
        countFormatter={formatQuantity}
        amountFormatter={formatAmount}
      />
      <ReportTable
        caption="Servicios más vendidos (top 10)"
        rows={data.top}
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
