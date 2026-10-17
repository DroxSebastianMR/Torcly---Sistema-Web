import { Trash2 } from 'lucide-react'
import type { DateRangeValue } from '@/components/ui/date-range-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import {
  eligibilityOptions,
  priorityOptions,
} from '../services/replenishment.service'
import type {
  EligibilityFilters,
  RunHistoryFilters,
} from '../types/replenishment.types'

interface ReplenishmentToolbarProps {
  view: 'recommendations' | 'history'
  eligibilityFilters: EligibilityFilters
  historyFilters: RunHistoryFilters
  suggestions: readonly SmartSelectOption[]
  onEligibilityChange: (filters: EligibilityFilters) => void
  onHistoryChange: (filters: RunHistoryFilters) => void
}

export function ReplenishmentToolbar({
  view,
  eligibilityFilters,
  historyFilters,
  suggestions,
  onEligibilityChange,
  onHistoryChange,
}: ReplenishmentToolbarProps) {
  if (view === 'recommendations') {
    const hasEligibilityFilters =
      Boolean(eligibilityFilters.search.trim()) ||
      Boolean(eligibilityFilters.priority) ||
      Boolean(eligibilityFilters.eligible)

    const applyRange = (range: DateRangeValue) =>
      onEligibilityChange({
        ...eligibilityFilters,
        from: range.from,
        to: range.to,
        page: 1,
      })

    return (
      <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="w-full sm:w-80">
            <DateRangePicker
              value={{
                from: eligibilityFilters.from,
                to: eligibilityFilters.to,
              }}
              aria-label="Filtrar recomendaciones por período"
              onChange={applyRange}
            />
          </div>
          <label className="flex w-full items-center gap-2 text-sm text-muted-foreground sm:w-56">
            <span className="shrink-0">Cobertura</span>
            <Input
              type="number"
              min={1}
              max={365}
              aria-label="Días de cobertura objetivo"
              value={eligibilityFilters.coverageDays}
              onChange={(event) =>
                onEligibilityChange({
                  ...eligibilityFilters,
                  coverageDays: Number(event.target.value),
                  page: 1,
                })
              }
            />
            <span className="shrink-0">días</span>
          </label>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <SmartSelect
              value={eligibilityFilters.search}
              aria-label="Buscar recomendaciones"
              placeholder="Buscar por código o nombre de producto"
              searchPlaceholder="Escribe un código o nombre…"
              emptyMessage="Sigue escribiendo para buscar productos."
              forceSearch
              allowCustomValue
              options={suggestions}
              onChange={(search) =>
                onEligibilityChange({ ...eligibilityFilters, search, page: 1 })
              }
            />
          </div>
          <div className="w-full sm:w-56">
            <SmartSelect
              value={eligibilityFilters.priority}
              placeholder="Todas las prioridades"
              aria-label="Filtrar por prioridad"
              options={priorityOptions()}
              onChange={(priority) =>
                onEligibilityChange({
                  ...eligibilityFilters,
                  priority: priority as EligibilityFilters['priority'],
                  page: 1,
                })
              }
            />
          </div>
          <div className="w-full sm:w-56">
            <SmartSelect
              value={eligibilityFilters.eligible}
              placeholder="Todos los productos"
              aria-label="Filtrar por elegibilidad"
              options={eligibilityOptions()}
              onChange={(eligible) =>
                onEligibilityChange({
                  ...eligibilityFilters,
                  eligible: eligible as EligibilityFilters['eligible'],
                  page: 1,
                })
              }
            />
          </div>
          {hasEligibilityFilters && (
            <button
              type="button"
              aria-label="Limpiar filtros de recomendaciones"
              onClick={() =>
                onEligibilityChange({
                  ...eligibilityFilters,
                  search: '',
                  priority: '',
                  eligible: '',
                  page: 1,
                })
              }
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              <Trash2 aria-hidden size={17} />
            </button>
          )}
        </div>
      </div>
    )
  }

  const hasHistoryFilters =
    Boolean(historyFilters.from) || Boolean(historyFilters.to)

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 lg:flex-row lg:items-center">
      <div className="w-full sm:w-80">
        <DateRangePicker
          value={{ from: historyFilters.from, to: historyFilters.to }}
          aria-label="Filtrar corridas por fecha de ejecución"
          onChange={({ from, to }) =>
            onHistoryChange({ ...historyFilters, from, to, page: 1 })
          }
        />
      </div>
      {hasHistoryFilters && (
        <button
          type="button"
          aria-label="Limpiar filtros de historial"
          onClick={() =>
            onHistoryChange({ ...historyFilters, from: '', to: '', page: 1 })
          }
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <Trash2 aria-hidden size={17} />
        </button>
      )}
    </div>
  )
}
