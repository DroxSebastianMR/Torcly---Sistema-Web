import { Trash2 } from 'lucide-react'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import { movementTypeOptions } from '../services/inventory.service'
import type {
  ExistenceItem,
  InventoryFilters,
  MovementFilters,
} from '../types/inventory.types'

interface InventoryToolbarProps {
  view: 'existence' | 'movements'
  existenceFilters: InventoryFilters
  movementFilters: MovementFilters
  products: ExistenceItem[]
  existenceSuggestions: readonly SmartSelectOption[]
  onExistenceChange: (filters: InventoryFilters) => void
  onMovementsChange: (filters: MovementFilters) => void
}

export function InventoryToolbar({
  view,
  existenceFilters,
  movementFilters,
  products,
  existenceSuggestions,
  onExistenceChange,
  onMovementsChange,
}: InventoryToolbarProps) {
  if (view === 'existence') {
    return (
      <div className="flex gap-3 border-b bg-card px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <SmartSelect
            value={existenceFilters.search}
            aria-label="Buscar existencias"
            placeholder="Buscar por código o nombre de producto"
            searchPlaceholder="Escribe un código o nombre…"
            emptyMessage="Sigue escribiendo para buscar productos."
            forceSearch
            allowCustomValue
            options={existenceSuggestions}
            onChange={(search) =>
              onExistenceChange({ ...existenceFilters, search, page: 1 })
            }
          />
        </div>
        {existenceFilters.search && (
          <button
            type="button"
            aria-label="Limpiar búsqueda de existencias"
            onClick={() =>
              onExistenceChange({ ...existenceFilters, search: '', page: 1 })
            }
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            <Trash2 aria-hidden size={17} />
          </button>
        )}
      </div>
    )
  }

  const productOptions = products.map((product) => ({
    value: product.productId,
    label: `${product.name} · ${product.code}`,
    searchTerms: [product.code, product.name, product.unit.symbol],
  }))
  const hasMovementFilters =
    Boolean(movementFilters.productId) ||
    Boolean(movementFilters.type) ||
    Boolean(movementFilters.from) ||
    Boolean(movementFilters.to)

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
      <div className="w-full xl:w-72">
        <SmartSelect
          value={movementFilters.productId}
          placeholder="Todos los productos"
          aria-label="Filtrar por producto"
          forceSearch
          options={productOptions}
          onChange={(productId) =>
            onMovementsChange({ ...movementFilters, productId, page: 1 })
          }
        />
      </div>
      <div className="w-full sm:w-56">
        <SmartSelect
          value={movementFilters.type}
          placeholder="Todos los tipos"
          aria-label="Filtrar por tipo de movimiento"
          menuMaxHeight={360}
          options={movementTypeOptions()}
          onChange={(type) =>
            onMovementsChange({
              ...movementFilters,
              type: type as MovementFilters['type'],
              page: 1,
            })
          }
        />
      </div>
      <div className="w-full sm:w-64">
        <DateRangePicker
          value={{ from: movementFilters.from, to: movementFilters.to }}
          aria-label="Filtrar por periodo"
          onChange={({ from, to }) =>
            onMovementsChange({ ...movementFilters, from, to, page: 1 })
          }
        />
      </div>
      {hasMovementFilters && (
        <button
          type="button"
          aria-label="Limpiar filtros de historial"
          onClick={() =>
            onMovementsChange({
              productId: '',
              type: '',
              from: '',
              to: '',
              page: 1,
              pageSize: movementFilters.pageSize,
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
