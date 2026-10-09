import { ReceiptText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { BarChart } from '../bar-chart'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import type { SalesBlockData } from '../../types/reports.types'
import {
  formatAmount,
  formatCount,
  formatQuantity,
  lineTypeLabel,
} from '../../utils/report-formatters'

export function SalesBlockContent({ data }: { data: SalesBlockData }) {
  const isEmpty = data.metrics.count === 0 && data.metrics.amount === 0
  if (isEmpty) {
    return (
      <EmptyState
        className="min-h-44"
        title="Sin ventas en el período"
        description={
          data.period.from === data.period.to
            ? 'No hay ventas confirmadas en la fecha consultada.'
            : 'No hay ventas confirmadas en el rango consultado.'
        }
      />
    )
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard label="Ventas" value={formatCount(data.metrics.count)} />
        <IndicatorCard
          label="Importe"
          value={formatAmount(data.metrics.amount)}
        />
        <IndicatorCard
          label="Ticket promedio"
          value={formatAmount(data.metrics.averageTicket)}
          hint="Importe entre ventas confirmadas"
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
        label="Tendencia de ventas"
        ariaLabel="Tendencia de ventas confirmadas"
        caption={`Tendencia de ventas confirmadas: ${data.period.from} a ${data.period.to}`}
        countLabel="Ventas"
        amountLabel="Importe"
        countFormatter={formatCount}
        amountFormatter={formatAmount}
      />
      <ReportTable
        caption="Composición por producto o servicio (top 10)"
        rows={data.composition}
        columns={[
          {
            key: 'name',
            header: 'Producto o servicio',
            cell: (row) => (
              <span>
                {row.name} <span className="text-xs">({row.code})</span>
              </span>
            ),
          },
          {
            key: 'type',
            header: 'Tipo',
            cell: (row) => lineTypeLabel(row.type),
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

export function SalesBlockIcon() {
  return <ReceiptText aria-hidden className="size-5 text-primary" />
}
