import { ArrowDownUp, Package, TriangleAlert } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { IndicatorCard } from '../indicator-card'
import { ReportTable } from '../report-table'
import { TrendChart } from '../trend-chart'
import type { InventoryBlockData } from '../../types/reports.types'
import {
  formatCount,
  formatQuantity,
  movementTypeLabel,
} from '../../utils/report-formatters'

const movementOrder = [
  'INITIAL',
  'ENTRY',
  'EXIT',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
] as const

export function InventoryBlockContent({ data }: { data: InventoryBlockData }) {
  const isEmpty =
    data.metrics.movementCount === 0 && data.metrics.lowStockCount === 0
  const byType = movementOrder
    .filter((type) => data.metrics.byType[type] !== undefined)
    .map((type) => ({ type, count: data.metrics.byType[type] }))
  const lowStock = data.lowStock
  if (isEmpty) {
    return (
      <EmptyState
        className="min-h-44"
        title="Sin movimientos en el período"
        description="No hay movimientos confirmados ni productos con stock bajo en esta consulta."
      />
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <IndicatorCard
          label="Movimientos"
          value={formatCount(data.metrics.movementCount)}
          hint="Confirmados en el período"
          icon={<ArrowDownUp className="size-4" />}
          tone="cyan"
        />
        <IndicatorCard
          label="Cantidad neta"
          value={formatQuantity(data.metrics.netQuantity)}
          hint="Según la regla de stock confirmado"
          icon={<Package className="size-4" />}
          tone="purple"
        />
        <IndicatorCard
          label="Stock bajo"
          value={formatCount(data.metrics.lowStockCount)}
          hint="Instantánea actual de productos"
          icon={<TriangleAlert className="size-4" />}
          tone="red"
        />
      </div>
      <TrendChart
        data={data.trend}
        type="bar"
        title="Movimientos de inventario"
        ariaLabel="Tendencia de cantidad neta del período"
        series={[
          {
            key: 'entry',
            label: 'Entradas',
            color: '#147357',
            formatter: formatQuantity,
          },
          {
            key: 'exit',
            label: 'Salidas',
            color: '#c85d00',
            formatter: formatQuantity,
          },
          {
            key: 'adjustmentIn',
            label: 'Ajuste ingreso',
            color: '#2a79a5',
            formatter: formatQuantity,
          },
          {
            key: 'adjustmentOut',
            label: 'Ajuste egreso',
            color: '#b23a48',
            formatter: formatQuantity,
          },
        ]}
      />
      <ReportTable
        caption="Movimientos por tipo"
        rows={byType}
        columns={[
          {
            key: 'type',
            header: 'Tipo de movimiento',
            cell: (row) => movementTypeLabel[row.type] ?? row.type,
          },
          {
            key: 'count',
            header: 'Cantidad',
            align: 'right',
            cell: (row) => formatCount(row.count),
          },
        ]}
      />
      {lowStock.length > 0 && (
        <ReportTable
          caption="Productos que requieren atención"
          rows={lowStock.slice(0, 5)}
          ranked
          columns={[
            {
              key: 'name',
              header: 'Producto',
              cell: (row) => (
                <span>
                  {row.name} <span className="text-xs">({row.code})</span>
                </span>
              ),
            },
            {
              key: 'stock',
              header: 'Stock',
              align: 'right',
              cell: (row) => `${formatQuantity(row.stock)} ${row.unitLabel}`,
            },
            {
              key: 'minimumStock',
              header: 'Mínimo',
              align: 'right',
              cell: (row) =>
                `${formatQuantity(row.minimumStock)} ${row.unitLabel}`,
            },
          ]}
        />
      )}
    </div>
  )
}

export function InventoryBlockIcon() {
  return <Package aria-hidden className="size-5 text-primary" />
}
