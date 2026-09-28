import { MoreHorizontal, Receipt, ShoppingCart } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { SaleSummary } from '../types/sales.types'
import {
  currencyFormatter,
  dateTimeFormatter,
  saleStatusLabel,
} from '../utils/sale-formatters'

interface SalesTableProps {
  sales: SaleSummary[]
  loading: boolean
  onOpen: (sale: SaleSummary) => void
}

export function SalesTable({ sales, loading, onOpen }: SalesTableProps) {
  if (loading) return <SalesSkeleton />

  if (!sales.length) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No se encontraron ventas"
        description="Ajusta los filtros o registra la primera venta."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Venta</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="group cursor-pointer hover:bg-[#f9fbfa]"
                onClick={() => onOpen(sale)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-xs font-bold text-primary">
                      <Receipt size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="max-w-48 truncate font-semibold text-foreground">
                        {sale.code}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sale.performedBy}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-48 px-4 py-4">
                  <p className="truncate">
                    {sale.customer ? sale.customer.name : 'Venta sin cliente'}
                  </p>
                  {sale.customer && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {sale.customer.documentNumber}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {dateTimeFormatter.format(new Date(sale.createdAt))}
                </td>
                <td className="px-4 py-4 tabular-nums">{sale.lineCount}</td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">
                  {currencyFormatter.format(sale.total)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={sale.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {sales.map((sale) => (
          <article
            key={sale.id}
            className="px-4 py-4"
            onClick={() => onOpen(sale)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="max-w-full truncate font-semibold">{sale.code}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {sale.customer ? sale.customer.name : 'Venta sin cliente'}
                </p>
              </div>
              <StatusBadge status={sale.status} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="mt-1 text-muted-foreground">
                  {dateTimeFormatter.format(new Date(sale.createdAt))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="mt-1 tabular-nums">{sale.lineCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {currencyFormatter.format(sale.total)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function StatusBadge({ status }: { status: SaleSummary['status'] }) {
  const confirmed = status === 'CONFIRMED'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        confirmed
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {saleStatusLabel(status)}
    </span>
  )
}

function SalesSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando ventas">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-44 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
