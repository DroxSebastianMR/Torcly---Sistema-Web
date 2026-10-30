import { CircleDollarSign, TriangleAlert, Wallet } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { paymentCollectionStatusLabel } from '@/features/cash/utils/payment-formatters'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import { CompositionChart } from '../composition-chart'
import { TrendChart } from '../trend-chart'
import type { PaymentsBlockData } from '../../types/reports.types'
import { formatAmount, formatCount } from '../../utils/report-formatters'

const statusOrder = ['PENDING', 'PARTIALLY_PAID', 'PAID'] as const

export function PaymentsBlockContent({ data }: { data: PaymentsBlockData }) {
  const isEmpty =
    data.metrics.pendingCount === 0 && data.metrics.paymentCount === 0
  const byStatus = statusOrder.map((status) => ({
    status,
    ...data.metrics.byStatus[status],
  }))
  if (isEmpty) {
    return (
      <EmptyState
        className="min-h-44"
        title="Sin cobros en el período"
        description="No hay pagos, compensaciones u obligaciones pendientes que reportar en esta consulta."
      />
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Cobrado neto"
          value={formatAmount(data.metrics.netCollected)}
          hint="Pagos menos compensaciones del período"
          icon={<Wallet className="size-4" />}
          tone="cyan"
        />
        <IndicatorCard
          label="Saldo pendiente"
          value={formatAmount(data.metrics.pendingAmount)}
          hint="Instantánea actual de ventas con saldo"
          icon={<CircleDollarSign className="size-4" />}
          tone="purple"
        />
        <IndicatorCard
          label="Obligaciones"
          value={formatCount(data.metrics.pendingCount)}
          hint="Con saldo pendiente hoy"
          icon={<TriangleAlert className="size-4" />}
          tone="red"
        />
      </div>
      <TrendChart
        data={data.trend}
        type="bar"
        title="Cobros y compensaciones"
        ariaLabel="Tendencia de cobro neto del período"
        series={[
          {
            key: 'grossCollected',
            label: 'Pagos',
            color: '#147357',
            formatter: formatAmount,
          },
          {
            key: 'compensated',
            label: 'Compensaciones',
            color: '#c85d00',
            formatter: formatAmount,
          },
          {
            key: 'netCollected',
            label: 'Neto',
            color: '#083b2d',
            formatter: formatAmount,
          },
        ]}
      />
      <CompositionChart
        title="Estado de las obligaciones"
        ariaLabel="Distribución de obligaciones de cobro por estado"
        formatter={formatCount}
        rows={byStatus.map((row) => ({
          key: row.status,
          label: paymentCollectionStatusLabel(row.status),
          value: row.count,
          color:
            row.status === 'PAID'
              ? '#147357'
              : row.status === 'PARTIALLY_PAID'
                ? '#c85d00'
                : '#b23a48',
        }))}
      />
      <ReportTable
        caption="Estado de las obligaciones (instantánea)"
        rows={byStatus}
        columns={[
          {
            key: 'status',
            header: 'Estado',
            cell: (row) => paymentCollectionStatusLabel(row.status),
          },
          {
            key: 'count',
            header: 'Ventas',
            align: 'right',
            cell: (row) => formatCount(row.count),
          },
          {
            key: 'amount',
            header: 'Saldo',
            align: 'right',
            cell: (row) => formatAmount(row.amount),
          },
        ]}
      />
    </div>
  )
}

export function PaymentsBlockIcon() {
  return <Wallet aria-hidden className="size-5 text-primary" />
}
