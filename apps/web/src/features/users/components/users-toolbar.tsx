import { Trash2 } from 'lucide-react'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { UserFilters } from '../types/users.types'

interface UsersToolbarProps {
  filters: UserFilters
  onChange: (filters: UserFilters) => void
  suggestions: readonly SmartSelectOption[]
}

export function UsersToolbar({
  filters,
  onChange,
  suggestions,
}: UsersToolbarProps) {
  const hasFilters = filters.search || filters.status !== 'all'
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar usuarios"
          placeholder="Buscar por usuario, correo o nombre"
          searchPlaceholder="Escribe un usuario, correo o nombre…"
          emptyMessage="Sigue escribiendo para buscar usuarios."
          forceSearch
          allowCustomValue
          options={suggestions}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-44">
          <SmartSelect
            value={filters.status}
            aria-label="Estado"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
            onChange={(status) =>
              onChange({
                ...filters,
                status: status as UserFilters['status'],
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
