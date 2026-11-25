import { useState } from 'react'
import { SmartSelect } from '@/components/ui/smart-select'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { useInventoryProductOptions } from '../hooks/use-inventory'
import type { ExistenceItem } from '../types/inventory.types'

interface Props {
  value: string
  selected?: ExistenceItem
  activeOnly?: boolean
  onChange: (product: ExistenceItem) => void
}

const label = (product: ExistenceItem) => `${product.name} · ${product.code}`

export function InventoryProductSelect({
  value,
  selected,
  activeOnly,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const term = search.trim()
  const debounced = useDebouncedValue(term)
  const query = useInventoryProductOptions(open, debounced)
  const waiting = term !== debounced || query.isPending
  const products = waiting ? [] : (query.data ?? [])
  const options = activeOnly
    ? products.filter((product) => product.active)
    : products
  return (
    <SmartSelect
      value={value}
      selectedLabel={
        selected?.productId === value && selected ? label(selected) : undefined
      }
      aria-label={activeOnly ? 'Producto' : 'Filtrar por producto'}
      placeholder={activeOnly ? 'Buscar producto' : 'Todos los productos'}
      searchPlaceholder="Buscar por nombre o código…"
      forceSearch
      onOpenChange={setOpen}
      onSearch={setSearch}
      options={options.map((product) => ({
        value: product.productId,
        label: label(product),
      }))}
      emptyMessage={
        waiting
          ? 'Buscando productos…'
          : query.isError
            ? 'Error al cargar los productos.'
            : 'Sin opciones.'
      }
      onLoadMore={
        !waiting &&
        query.hasNextPage &&
        (!activeOnly || products.every((p) => p.active))
          ? () => void query.fetchNextPage()
          : undefined
      }
      loadingMore={query.isFetchingNextPage}
      onChange={(id) => {
        const product = options.find((option) => option.productId === id)
        if (product) onChange(product)
      }}
    />
  )
}
