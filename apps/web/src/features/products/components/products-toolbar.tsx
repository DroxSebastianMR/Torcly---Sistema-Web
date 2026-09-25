import { useState } from 'react'
import { SlidersHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  SmartSelect,
  type SmartSelectOption,
} from '@/components/ui/smart-select'
import type { ProductFilters, ProductOptions } from '../types/products.types'

interface ProductsToolbarProps {
  filters: ProductFilters
  options?: ProductOptions
  onChange: (filters: ProductFilters) => void
  suggestions: readonly SmartSelectOption[]
}

export function ProductsToolbar({
  filters,
  options,
  onChange,
  suggestions,
}: ProductsToolbarProps) {
  const hasFilters =
    filters.search || filters.categoryId || filters.status !== 'all'
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftCategoryId, setDraftCategoryId] = useState(filters.categoryId)
  const [draftStatus, setDraftStatus] = useState(filters.status)
  const categoryOptions =
    options?.categories.map((category) => ({
      value: category.id,
      label: category.name,
    })) ?? []

  const openFilters = () => {
    setDraftCategoryId(filters.categoryId)
    setDraftStatus(filters.status)
    setFiltersOpen(true)
  }

  return (
    <div className="flex flex-col gap-3 border-b bg-card px-4 py-4 sm:px-5 xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1">
        <SmartSelect
          value={filters.search}
          aria-label="Buscar productos"
          placeholder="Buscar por código, nombre o categoría"
          searchPlaceholder="Escribe un código, nombre o categoría…"
          emptyMessage="Sigue escribiendo para buscar productos."
          forceSearch
          allowCustomValue
          options={suggestions}
          onChange={(search) => onChange({ ...filters, search, page: 1 })}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-48">
          <SmartSelect
            value={filters.categoryId}
            placeholder="Todas las categorías"
            aria-label="Categoría"
            options={categoryOptions}
            onChange={(categoryId) =>
              onChange({ ...filters, categoryId, page: 1 })
            }
          />
        </div>
        <div className="w-full sm:w-40">
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
                status: status as ProductFilters['status'],
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
                categoryId: '',
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
        aria-label="Abrir filtros de productos"
        onClick={openFilters}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:border-primary/45 hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
      >
        <SlidersHorizontal aria-hidden size={17} />
      </button>
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filtros de productos"
        description="Combina categoría y estado para encontrar el catálogo que necesitas."
        className="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFiltersOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onChange({
                  ...filters,
                  categoryId: draftCategoryId,
                  status: draftStatus,
                  page: 1,
                })
                setFiltersOpen(false)
              }}
            >
              Aplicar filtros
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm font-medium text-brand-forest">
            Categoría
            <SmartSelect
              value={draftCategoryId}
              placeholder="Todas las categorías"
              aria-label="Categoría del producto"
              className="mt-2"
              options={categoryOptions}
              onChange={setDraftCategoryId}
            />
          </label>
          <label className="block text-sm font-medium text-brand-forest">
            Estado
            <SmartSelect
              value={draftStatus}
              aria-label="Estado del producto"
              className="mt-2"
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'active', label: 'Activos' },
                { value: 'inactive', label: 'Inactivos' },
              ]}
              onChange={(status) =>
                setDraftStatus(status as ProductFilters['status'])
              }
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
