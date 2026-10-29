import { Trash2 } from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { PaymentFilters } from '../types/payment.types'

interface PaymentsToolbarProps {
  filters: PaymentFilters
  onChange: (filters: PaymentFilters) => void
  suggestions: readonly SmartSelectOption[]
}

export function PaymentsToolbar({
  filters,
  onChange,
  suggestions,
}: PaymentsToolbarProps) {
  const hasFilters =
    Boolean(filters.search) ||
    filters.status !== 'all' ||
    filters.method !== 'all' ||
    Boolean(filters.from) ||
    Boolean(filters.to)

  const update = (patch: Partial<PaymentFilters>) =>
    onChange({ ...filters, ...patch, page: 1 })

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar cobros"
          placeholder="Buscar por venta, cliente o documento"
          searchPlaceholder="Escribe un código, cliente o documento…"
          emptyMessage="Sigue escribiendo para buscar cobros."
          forceSearch
          allowCustomValue
          options={suggestions}
          onChange={(search) => update({ search })}
        />
      </div>
      <div className="flex flex-wrap gap-3 xl:shrink-0">
        <div className="w-full sm:w-48">
          <SmartSelect
            value={filters.status}
            aria-label="Estado de cobro"
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'PENDING', label: 'Pendientes' },
              { value: 'PARTIALLY_PAID', label: 'Parcialmente pagados' },
              { value: 'PAID', label: 'Pagados' },
            ]}
            onChange={(status) =>
              update({ status: status as PaymentFilters['status'] })
            }
          />
        </div>
        <div className="w-full sm:w-48">
          <SmartSelect
            value={filters.method}
            aria-label="Método de pago"
            options={[
              { value: 'all', label: 'Todos los métodos' },
              { value: 'CASH', label: 'Efectivo' },
              { value: 'CARD', label: 'Tarjeta' },
              { value: 'TRANSFER', label: 'Transferencia' },
              { value: 'DIGITAL_WALLET', label: 'Billetera digital' },
            ]}
            onChange={(method) =>
              update({ method: method as PaymentFilters['method'] })
            }
          />
        </div>
        <DateRangePicker
          aria-label="Filtrar cobros por período"
          value={{ from: filters.from ?? '', to: filters.to ?? '' }}
          onChange={(range) =>
            update({ from: range.from || null, to: range.to || null })
          }
          className="w-full sm:w-72"
        />
        {hasFilters && (
          <button
            type="button"
            aria-label="Limpiar filtros"
            onClick={() =>
              onChange({
                search: '',
                status: 'all',
                method: 'all',
                from: null,
                to: null,
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
