import { ReceiptText, ShoppingBag, Ticket } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import { TrendChart } from '../trend-chart'
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
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Ventas"
          value={formatCount(data.metrics.count)}
          icon={<ShoppingBag className="size-4" />}
          tone="blue"
        />
        <IndicatorCard
          label="Importe"
          value={formatAmount(data.metrics.amount)}
          icon={<ReceiptText className="size-4" />}
          tone="green"
        />
        <IndicatorCard
          label="Ticket promedio"
          value={formatAmount(data.metrics.averageTicket)}
          hint="Importe entre ventas confirmadas"
          icon={<Ticket className="size-4" />}
          tone="purple"
        />
      </div>
      <TrendChart
        data={data.trend}
        type="area"
        title="Tendencia de ventas"
        ariaLabel="Tendencia de ventas confirmadas"
        series={[
          {
            key: 'amount',
            label: 'Importe confirmado',
            color: '#147357',
            formatter: formatAmount,
          },
        ]}
      />
      <ReportTable
        caption="Principales productos y servicios"
        rows={data.composition.slice(0, 5)}
        ranked
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
