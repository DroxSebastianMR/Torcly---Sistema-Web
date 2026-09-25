import { Trash2 } from 'lucide-react'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { SaleFilters } from '../types/sales.types'

interface SalesToolbarProps {
  filters: SaleFilters
  onChange: (filters: SaleFilters) => void
  suggestions: readonly SmartSelectOption[]
}

export function SalesToolbar({
  filters,
  onChange,
  suggestions,
}: SalesToolbarProps) {
  const hasFilters = filters.search || filters.status !== 'all'

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar ventas"
          placeholder="Buscar por código, cliente o documento"
          searchPlaceholder="Escribe un código, cliente o documento…"
          emptyMessage="Sigue escribiendo para buscar ventas."
          forceSearch
          allowCustomValue
          options={suggestions}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-48">
          <SmartSelect
            value={filters.status}
            aria-label="Estado de la venta"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'DRAFT', label: 'Borradores' },
              { value: 'CONFIRMED', label: 'Confirmadas' },
            ]}
            onChange={(status) =>
              onChange({
                ...filters,
                status: status as SaleFilters['status'],
                page: 1,
              })
            }
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            aria-label="Limpiar filtros"
            onClick={() =>
              onChange({
                search: '',
                status: 'all',
                page: 1,
                pageSize: filters.pageSize,
              })
            }
            className="inline-flex size-11 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            <Trash2 aria-hidden size={17} />
          </button>
        )}
      </div>
    </div>
  )
}
