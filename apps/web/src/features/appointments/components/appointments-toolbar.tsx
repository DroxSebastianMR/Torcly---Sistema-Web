import { Trash2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { AppointmentFilters } from '../types/appointments.types'

interface AppointmentsToolbarProps {
  filters: AppointmentFilters
  onChange: (filters: AppointmentFilters) => void
  customerOptions: SmartSelectOption[]
  suggestions: readonly SmartSelectOption[]
}

export function AppointmentsToolbar({
  filters,
  onChange,
  customerOptions,
  suggestions,
}: AppointmentsToolbarProps) {
  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.date) ||
    Boolean(filters.customerId) ||
    filters.status !== 'all'

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar citas"
          placeholder="Buscar por código, cliente, placa o motivo"
          searchPlaceholder="Escribe un código, cliente, placa o motivo…"
          emptyMessage="Sigue escribiendo para buscar citas."
          forceSearch
          allowCustomValue
          options={suggestions}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <DatePicker
          value={filters.date}
          name="date"
          aria-label="Filtrar por fecha"
          className="w-full sm:w-44"
          onChange={(date) => onChange({ ...filters, date, page: 1 })}
        />
        <div className="w-full sm:w-52">
          <SmartSelect
            value={filters.customerId}
            aria-label="Filtrar por cliente"
            placeholder="Todos los clientes"
            searchPlaceholder="Buscar cliente…"
            options={customerOptions}
            onChange={(customerId) =>
              onChange({ ...filters, customerId, page: 1 })
            }
          />
        </div>
        <div className="w-full sm:w-44">
          <SmartSelect
            value={filters.status}
            aria-label="Estado de la cita"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'PROGRAMADA', label: 'Programadas' },
              { value: 'CANCELADA', label: 'Canceladas' },
            ]}
            onChange={(status) =>
              onChange({
                ...filters,
                status: status as AppointmentFilters['status'],
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
                date: '',
                customerId: '',
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
