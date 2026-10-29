import { useActiveSuppliers } from '../hooks/use-purchases'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { SmartSelect } from '@/components/ui/smart-select'
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
        <div className="w-full sm:w-64">
          <SmartSelect
            aria-label="Filtrar por proveedor"
            value={filters.supplierId ?? ''}
            options={[
              { value: '', label: 'Todos los proveedores' },
              ...(suppliers.data?.map((supplier) => ({
                value: supplier.id,
                label: supplier.legalName,
                meta: supplier.documentNumber,
              })) ?? []),
            ]}
            onChange={(value) =>
              onFilterChange({
                supplierId: value || undefined,
                page: 1,
              })
            }
          />
        </div>
        <DateRangePicker
          aria-label="Filtrar compras por período"
          value={{ from: filters.from ?? '', to: filters.to ?? '' }}
          onChange={(range) =>
            onFilterChange({
              from: range.from || undefined,
              to: range.to || undefined,
              page: 1,
            })
          }
          className="w-full sm:w-80"
        />
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
