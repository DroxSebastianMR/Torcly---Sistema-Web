import { Eye, Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { TableActionButton } from '@/components/ui/table-action-button'
import type { PurchaseSummary } from '../types/purchases.types'
import {
  currencyFormatter,
  formatPurchaseDate,
} from '../utils/purchase-formatters'
import { PurchaseStatusBadge } from './purchase-status-badge'

interface PurchasesTableProps {
  purchases: PurchaseSummary[]
  loading: boolean
  onOpen: (purchase: PurchaseSummary) => void
}

function PurchasesSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-5 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-muted" />
      ))}
    </div>
  )
}

export function PurchasesTable({
  purchases,
  loading,
  onOpen,
}: PurchasesTableProps) {
  if (loading) return <PurchasesSkeleton />

  if (!purchases.length) {
    return (
      <EmptyState
        icon={Package}
        title="No se encontraron compras"
        description="Ajusta los filtros o registra la primera compra."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
            <tr>
              <th className="px-5 py-3">Código</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Ítems</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="w-16 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {purchases.map((purchase) => (
              <tr
                key={purchase.id}
                className="group cursor-pointer hover:bg-[#f9fbfa]"
                onClick={() => onOpen(purchase)}
              >
                <td className="px-5 py-3 font-mono text-xs font-semibold text-primary">
                  {purchase.code}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {purchase.supplier.legalName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {purchase.supplier.documentNumber}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatPurchaseDate(purchase.purchaseDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {purchase.lineCount}
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {currencyFormatter.format(purchase.total)}
                </td>
                <td className="px-4 py-3">
                  <PurchaseStatusBadge status={purchase.status} />
                </td>
                <td className="px-4 py-3">
                  <TableActionButton
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpen(purchase)
                    }}
                    label={`Ver compra ${purchase.code}`}
                    title="Ver detalle"
                  >
                    <Eye aria-hidden size={15} />
                  </TableActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {purchases.map((purchase) => (
          <button
            type="button"
            key={purchase.id}
            className="flex w-full items-start gap-4 px-4 py-4 text-left hover:bg-muted/40"
            onClick={() => onOpen(purchase)}
          >
            <Package
              size={18}
              className="mt-0.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  {purchase.code}
                </span>
                <PurchaseStatusBadge status={purchase.status} />
              </div>
              <div className="mt-0.5 truncate text-sm font-medium">
                {purchase.supplier.legalName}
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatPurchaseDate(purchase.purchaseDate)}</span>
                <span>·</span>
                <span className="font-semibold text-foreground">
                  {currencyFormatter.format(purchase.total)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}
