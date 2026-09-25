import { Trash2 } from 'lucide-react'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { CustomerFilters } from '../types/customers.types'

function matchesCustomerSuggestion(option: SmartSelectOption, query: string) {
  const [documentNumber = '', phone = '', displayName = ''] =
    option.searchTerms ?? []

  if (/^\d+$/.test(query)) return documentNumber === query

  return [displayName, documentNumber, phone].some((term) =>
    term.toLocaleLowerCase('es').includes(query),
  )
}

interface CustomersToolbarProps {
  filters: CustomerFilters
  onChange: (filters: CustomerFilters) => void
  suggestions: readonly SmartSelectOption[]
}

export function CustomersToolbar({
  filters,
  onChange,
  suggestions,
}: CustomersToolbarProps) {
  const hasFilters = filters.search || filters.type !== 'all'

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar clientes"
          placeholder="Buscar por DNI, RUC, nombre o teléfono"
          searchPlaceholder="Escribe documento, nombre o teléfono…"
          emptyMessage="Sigue escribiendo para buscar clientes."
          forceSearch
          allowCustomValue
          options={suggestions}
          filterOption={matchesCustomerSuggestion}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-56">
          <SmartSelect
            value={filters.type}
            aria-label="Tipo de cliente"
            options={[
              { value: 'all', label: 'Todos los tipos' },
              { value: 'NATURAL', label: 'Personas naturales' },
              { value: 'LEGAL', label: 'Personas jurídicas' },
            ]}
            onChange={(type) =>
              onChange({
                ...filters,
                type: type as CustomerFilters['type'],
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
                type: 'all',
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
