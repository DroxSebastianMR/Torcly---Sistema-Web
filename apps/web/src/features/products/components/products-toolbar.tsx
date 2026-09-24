import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ProductFilters, ProductOptions } from '../types/products.types'

interface ProductsToolbarProps {
  filters: ProductFilters
  options?: ProductOptions
  onChange: (filters: ProductFilters) => void
}

const selectClass =
  'h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring'

export function ProductsToolbar({
  filters,
  options,
  onChange,
}: ProductsToolbarProps) {
  const hasFilters =
    filters.search || filters.categoryId || filters.status !== 'all'

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
          placeholder="Buscar por código, nombre, categoría o código de barras"
          className="bg-card pl-10"
          aria-label="Buscar productos"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative">
          <span className="sr-only">Categoría</span>
          <select
            value={filters.categoryId}
            onChange={(event) =>
              onChange({ ...filters, categoryId: event.target.value, page: 1 })
            }
            className={`${selectClass} w-full sm:w-48`}
          >
            <option value="">Todas las categorías</option>
            {options?.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative">
          <span className="sr-only">Estado</span>
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as ProductFilters['status'],
                page: 1,
              })
            }
            className={`${selectClass} w-full sm:w-40`}
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
                categoryId: '',
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
