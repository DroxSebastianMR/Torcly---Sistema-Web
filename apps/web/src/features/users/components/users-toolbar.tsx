import { useState } from 'react'
import { SlidersHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState(filters.status)

  const openFilters = () => {
    setDraftStatus(filters.status)
    setFiltersOpen(true)
  }

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
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
      <button
        type="button"
        aria-label="Abrir filtros de usuarios"
        onClick={openFilters}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:border-primary/45 hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <SlidersHorizontal aria-hidden size={17} />
      </button>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros de usuarios"
        description="Refina el listado sin perder la búsqueda actual."
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFiltersOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onChange({ ...filters, status: draftStatus, page: 1 })
                setFiltersOpen(false)
              }}
            >
              Aplicar filtros
            </Button>
          </div>
        }
      >
        <label className="block text-sm font-medium text-brand-forest">
          Estado de la cuenta
          <SmartSelect
            value={draftStatus}
            aria-label="Estado de la cuenta"
            className="mt-2"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
            ]}
            onChange={(status) =>
              setDraftStatus(status as UserFilters['status'])
            }
          />
        </label>
      </Modal>
    </div>
  )
}
