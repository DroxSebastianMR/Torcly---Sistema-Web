import type {
  WorkOrderDetail,
  WorkOrderExecution,
  WorkOrderLine,
} from '../types/work-orders.types'
import {
  currencyFormatter,
  quantityFormatter,
} from '../utils/work-order-formatters'

interface WorkOrderFinalSummaryProps {
  order: WorkOrderDetail
  execution: WorkOrderExecution
}

interface FinalLine {
  line: WorkOrderLine
  consumed: number | null
  returned: number | null
  billableQuantity: number
  subtotal: number
}

export function WorkOrderFinalSummary({
  order,
  execution,
}: WorkOrderFinalSummaryProps) {
  const finalLines = order.lines.map<FinalLine>((line) => {
    if (line.type === 'SERVICE') {
      return {
        line,
        consumed: null,
        returned: null,
        billableQuantity: line.quantity,
        subtotal: roundMoney(line.unitPrice * line.quantity),
      }
    }

    const executionLine = execution.productLines.find(
      (productLine) => productLine.lineId === line.id,
    )
    const consumed = executionLine?.consumed ?? 0
    const returned = executionLine?.returned ?? 0
    const billableQuantity = executionLine?.netConsumed ?? 0
    return {
      line,
      consumed,
      returned,
      billableQuantity,
      subtotal: roundMoney(line.unitPrice * billableQuantity),
    }
  })
  const finalTotal = roundMoney(
    finalLines.reduce((sum, line) => sum + line.subtotal, 0),
  )
  const difference = finalTotal - order.total
  const delivered = order.status === 'ENTREGADA'

  return (
    <section
      className="overflow-hidden rounded-xl border border-emerald-200/80"
      aria-label="Resumen final de la orden"
    >
      <div className="border-b border-emerald-100 bg-emerald-50/60 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Resumen final de la orden
        </p>
        <p className="mt-1 text-sm text-emerald-950/75">
          Se factura el consumo neto: consumido menos devuelto. Los pendientes
          no se cobran.
        </p>
      </div>

      <div className="grid gap-3 border-b bg-background px-4 py-3 sm:grid-cols-3">
        <SummaryValue
          label="Presupuesto inicial"
          value={currencyFormatter.format(order.total)}
        />
        <SummaryValue
          label={delivered ? 'Total facturado' : 'Total a facturar'}
          value={currencyFormatter.format(finalTotal)}
          emphasis
        />
        <SummaryValue
          label="Variación"
          value={`${difference > 0 ? '+' : ''}${currencyFormatter.format(difference)}`}
          tone={
            difference === 0
              ? 'default'
              : difference > 0
                ? 'warning'
                : 'success'
          }
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f] dark:border-[#365047] dark:bg-[#1d2a26] dark:text-[#aac4b8]">
            <tr>
              <th className="px-4 py-2.5">Detalle</th>
              <th className="px-4 py-2.5 text-right">Ppto.</th>
              <th className="px-4 py-2.5 text-right">Consumido</th>
              <th className="px-4 py-2.5 text-right">Devuelto</th>
              <th className="px-4 py-2.5 text-right">Consumo neto</th>
              <th className="px-4 py-2.5 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {finalLines.map((item) => (
              <FinalLineRow key={item.line.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {finalLines.map((item) => (
          <div key={item.line.id} className="px-4 py-3">
            <p className="font-medium">{item.line.name}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {item.line.code}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <MobileValue label="Presupuesto" value={item.line.quantity} />
              <MobileValue
                label="Consumo neto"
                value={item.billableQuantity}
                emphasis
              />
              <MobileValue label="Consumido" value={item.consumed} />
              <MobileValue label="Devuelto" value={item.returned} />
            </dl>
            <p className="mt-3 text-right text-sm font-semibold tabular-nums">
              {currencyFormatter.format(item.subtotal)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function FinalLineRow({ item }: { item: FinalLine }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium">{item.line.name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {item.line.code}
        </p>
      </td>
      <QuantityCell value={item.line.quantity} />
      <QuantityCell value={item.consumed} />
      <QuantityCell value={item.returned} />
      <QuantityCell value={item.billableQuantity} emphasis />
      <td className="px-4 py-3 text-right font-semibold tabular-nums">
        {currencyFormatter.format(item.subtotal)}
      </td>
    </tr>
  )
}

function QuantityCell({
  value,
  emphasis = false,
}: {
  value: number | null
  emphasis?: boolean
}) {
  return (
    <td
      className={`px-4 py-3 text-right tabular-nums ${emphasis ? 'font-semibold' : ''}`}
    >
      {value === null ? '—' : quantityFormatter.format(value)}
    </td>
  )
}

function SummaryValue({
  label,
  value,
  emphasis = false,
  tone = 'default',
}: {
  label: string
  value: string
  emphasis?: boolean
  tone?: 'default' | 'success' | 'warning'
}) {
  const color =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : 'text-foreground'
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 tabular-nums ${emphasis ? 'text-lg font-bold text-brand-forest' : `font-semibold ${color}`}`}
      >
        {value}
      </p>
    </div>
  )
}

function MobileValue({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: number | null
  emphasis?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${emphasis ? 'font-semibold' : ''}`}>
        {value === null ? '—' : quantityFormatter.format(value)}
      </dd>
    </div>
  )
}
