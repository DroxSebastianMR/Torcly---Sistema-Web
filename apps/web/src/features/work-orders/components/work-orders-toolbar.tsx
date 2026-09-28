import { Trash2 } from 'lucide-react'
import { SmartSelect } from '@/components/ui/smart-select'
import type { WorkOrderFilters } from '../types/work-orders.types'
import type { WorkOrderTechnician } from '../types/work-orders.types'

interface WorkOrdersToolbarProps {
  filters: WorkOrderFilters
  onChange: (filters: WorkOrderFilters) => void
  suggestions: readonly {
    value: string
    label: string
    searchTerms: string[]
  }[]
  technicians: WorkOrderTechnician[]
}

export function WorkOrdersToolbar({
  filters,
  onChange,
  suggestions,
  technicians,
}: WorkOrdersToolbarProps) {
  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.technicianId) ||
    filters.status !== 'all'

  return (
    <div className="flex min-w-0 flex-col gap-3 px-4 py-3 sm:px-5">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar órdenes"
          placeholder="Buscar por código, cliente, placa o cita"
          searchPlaceholder="Escribe un código, cliente o placa…"
          emptyMessage="Sigue escribiendo para buscar órdenes."
          forceSearch
          allowCustomValue
          options={suggestions}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-52">
          <SmartSelect
            value={filters.status}
            aria-label="Estado de la orden"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'RECEPCIONADA', label: 'Recepcionadas' },
              { value: 'EN_DIAGNOSTICO', label: 'En diagnóstico' },
              { value: 'PENDIENTE_APROBACION', label: 'Pte. aprobación' },
              { value: 'APROBADA', label: 'Aprobadas' },
              { value: 'RECHAZADA', label: 'Rechazadas' },
            ]}
            onChange={(status) =>
              onChange({
                ...filters,
                status: status as WorkOrderFilters['status'],
                page: 1,
              })
            }
          />
        </div>
        <div className="w-full sm:w-56">
          <SmartSelect
            value={filters.technicianId}
            aria-label="Filtrar por técnico"
            placeholder="Todos los técnicos"
            options={[
              { value: '', label: 'Sin técnico asignado' },
              ...technicians.map((technician) => ({
                value: technician.id,
                label: technician.displayName,
              })),
            ]}
            onChange={(technicianId) =>
              onChange({ ...filters, technicianId, page: 1 })
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
                technicianId: '',
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
