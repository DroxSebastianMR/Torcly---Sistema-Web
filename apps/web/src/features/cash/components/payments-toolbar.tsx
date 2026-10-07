import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5">
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="w-full lg:w-48">
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
        <div className="w-full lg:w-48">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
            Desde
            <Input
              type="date"
              aria-label="Fecha inicial"
              value={filters.from ?? ''}
              onChange={(event) => update({ from: event.target.value || null })}
            />
          </label>
          <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
            Hasta
            <Input
              type="date"
              aria-label="Fecha final"
              value={filters.to ?? ''}
              onChange={(event) => update({ to: event.target.value || null })}
            />
          </label>
        </div>
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
