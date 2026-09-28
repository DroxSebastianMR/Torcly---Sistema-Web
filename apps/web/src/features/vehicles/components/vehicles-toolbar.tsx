import { Trash2 } from 'lucide-react'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { VehicleFilters } from '../types/vehicles.types'

function matchesVehicleSuggestion(option: SmartSelectOption, query: string) {
  const [plate = '', documentNumber = '', owner = ''] = option.searchTerms ?? []

  if (/^\d+$/.test(query)) return plate === query || documentNumber === query

  return [plate, owner, documentNumber].some((term) =>
    term.toLocaleLowerCase('es').includes(query),
  )
}

interface VehiclesToolbarProps {
  filters: VehicleFilters
  onChange: (filters: VehicleFilters) => void
  suggestions: readonly SmartSelectOption[]
}

export function VehiclesToolbar({
  filters,
  onChange,
  suggestions,
}: VehiclesToolbarProps) {
  return (
    <div className="flex items-start gap-3 border-b bg-card px-4 py-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar vehículos"
          placeholder="Buscar por placa, propietario o documento"
          searchPlaceholder="Escribe placa, propietario o documento…"
          emptyMessage="Sigue escribiendo para buscar vehículos."
          forceSearch
          allowCustomValue
          options={suggestions}
          filterOption={matchesVehicleSuggestion}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      {filters.search && (
        <button
          type="button"
          aria-label="Limpiar filtros"
          onClick={() =>
            onChange({
              ...filters,
              search: '',
              page: 1,
              customerId: undefined,
            })
          }
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <Trash2 aria-hidden size={17} />
        </button>
      )}
    </div>
  )
}
