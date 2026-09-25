import { AlertTriangle, MoreHorizontal, PackageOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { ExistenceItem } from '../types/inventory.types'
import { numberFormatter } from '../utils/inventory-formatters'

interface ExistenceTableProps {
  items: ExistenceItem[]
  loading: boolean
  onOpenProduct?: (product: ExistenceItem) => void
}

export function ExistenceTable({
  items,
  loading,
  onOpenProduct,
}: ExistenceTableProps) {
  if (loading) return <ExistenceSkeleton />

  if (!items.length) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No se encontraron existencias"
        description="Ajusta los filtros o registra el primer inventario inicial."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Existencia</th>
              <th className="px-4 py-3 text-right">Stock mínimo</th>
              <th className="px-4 py-3 text-right">Último movimiento</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.productId} className="group hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-xs font-bold text-primary">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      {onOpenProduct ? (
                        <button
                          type="button"
                          onClick={() => onOpenProduct(item)}
                          aria-label={`Abrir ficha de ${item.name}`}
                          className="block max-w-64 truncate text-left font-semibold text-foreground hover:text-primary"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <p className="max-w-64 truncate font-semibold">
                          {item.name}
                        </p>
                      )}
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {item.code}
                        {item.active ? '' : ' · Inactivo'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <p className="font-semibold tabular-nums">
                    {numberFormatter.format(item.stock)}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      {item.unit.symbol}
                    </span>
                  </p>
                  {item.lowStock && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertTriangle size={12} /> Stock bajo
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                  {numberFormatter.format(item.minimumStock)}
                </td>
                <td className="px-4 py-4 text-right text-sm text-muted-foreground">
                  {item.lastMovementAt ? (
                    new Intl.DateTimeFormat('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(item.lastMovementAt))
                  ) : (
                    <span className="text-muted-foreground/60">Sin contar</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {!item.active ? (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Producto inactivo
                    </span>
                  ) : item.lowStock ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <AlertTriangle size={12} /> Por debajo del mínimo
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      En orden
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {items.map((item) => (
          <article key={item.productId} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="max-w-full truncate font-semibold">{item.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {item.code}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  !item.active
                    ? 'bg-slate-100 text-slate-600'
                    : item.lowStock
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {!item.active
                  ? 'Inactivo'
                  : item.lowStock
                    ? 'Stock bajo'
                    : 'OK'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Existencia</p>
                <p
                  className={`mt-1 font-semibold tabular-nums ${
                    item.lowStock ? 'text-amber-700' : ''
                  }`}
                >
                  {numberFormatter.format(item.stock)} {item.unit.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stock mínimo</p>
                <p className="mt-1 font-medium tabular-nums">
                  {numberFormatter.format(item.minimumStock)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">
                  Último movimiento
                </p>
                <p className="mt-1 font-medium">
                  {item.lastMovementAt
                    ? new Intl.DateTimeFormat('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(item.lastMovementAt))
                    : 'Sin contar'}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function ExistenceSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando existencias">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-28 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
