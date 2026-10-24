import { useActiveSuppliers } from '../hooks/use-purchases'
import type {
  PurchaseFilters,
  PurchaseStatusFilter,
} from '../types/purchases.types'

interface PurchasesToolbarProps {
  filters: PurchaseFilters
  onFilterChange: (filters: Partial<PurchaseFilters>) => void
}

export function PurchasesToolbar({
  filters,
  onFilterChange,
}: PurchasesToolbarProps) {
  const suppliers = useActiveSuppliers()

  const statuses: { label: string; value: PurchaseStatusFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'DRAFT' },
    { label: 'Recibidas', value: 'RECEIVED' },
    { label: 'Canceladas', value: 'CANCELLED' },
  ]

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <label htmlFor="supplierFilter" className="sr-only">
            Filtrar por proveedor
          </label>
          <select
            id="supplierFilter"
            value={filters.supplierId ?? ''}
            onChange={(e) =>
              onFilterChange({
                supplierId: e.target.value ? e.target.value : undefined,
                page: 1,
              })
            }
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.data?.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.legalName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="fromDate" className="text-xs text-muted-foreground">
            Desde
          </label>
          <input
            id="fromDate"
            type="date"
            value={filters.from ?? ''}
            onChange={(e) =>
              onFilterChange({
                from: e.target.value ? e.target.value : undefined,
                page: 1,
              })
            }
            className="h-9 rounded-lg border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />

          <label htmlFor="toDate" className="text-xs text-muted-foreground">
            Hasta
          </label>
          <input
            id="toDate"
            type="date"
            value={filters.to ?? ''}
            onChange={(e) =>
              onFilterChange({
                to: e.target.value ? e.target.value : undefined,
                page: 1,
              })
            }
            className="h-9 rounded-lg border bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Filtrar por estado"
        className="flex rounded-lg border bg-muted/40 p-0.5"
      >
        {statuses.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange({ status: value, page: 1 })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filters.status === value
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={filters.status === value}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
