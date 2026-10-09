import { Wallet } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { paymentCollectionStatusLabel } from '@/features/cash/utils/payment-formatters'
import { BarChart } from '../bar-chart'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
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
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Cobrado neto"
          value={formatAmount(data.metrics.netCollected)}
          hint="Pagos menos compensaciones del período"
        />
        <IndicatorCard
          label="Saldo pendiente"
          value={formatAmount(data.metrics.pendingAmount)}
          hint="Instantánea actual de ventas con saldo"
        />
        <IndicatorCard
          label="Obligaciones"
          value={formatCount(data.metrics.pendingCount)}
          hint="Con saldo pendiente hoy"
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
        label="Tendencia de cobro"
        ariaLabel="Tendencia de cobro neto del período"
        caption={`Tendencia de cobro neto: ${data.period.from} a ${data.period.to}`}
        countLabel="Movimientos"
        amountLabel="Cobrado"
        countFormatter={formatCount}
        amountFormatter={formatAmount}
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
