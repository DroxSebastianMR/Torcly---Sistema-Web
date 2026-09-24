import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { UserFilters } from '../types/users.types'

interface UsersToolbarProps {
  filters: UserFilters
  onChange: (filters: UserFilters) => void
}

const selectClass =
  'h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring'

export function UsersToolbar({ filters, onChange }: UsersToolbarProps) {
  const hasFilters = filters.search || filters.status !== 'all'

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          size={17}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value, page: 1 })
          }
          placeholder="Buscar por usuario, correo o nombre"
          className="bg-card pl-10"
          aria-label="Buscar usuarios"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative">
          <span className="sr-only">Estado</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as UserFilters['status'],
                page: 1,
              })
            }
            className={`${selectClass} w-full sm:w-44`}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </label>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({
                search: '',
                status: 'all',
                page: 1,
                pageSize: filters.pageSize,
              })
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={16} /> Limpiar
          </button>
        )}
      </div>
      <SlidersHorizontal
        aria-hidden="true"
        className="hidden text-muted-foreground xl:block"
        size={17}
      />
    </div>
  )
}
