import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useCatalogMutations } from '../hooks/use-products'
import type { ProductOptions } from '../types/products.types'
import { getProductErrorMessage } from '../utils/product-formatters'

type CatalogType = 'category' | 'brand' | 'unit'

interface ProductCatalogModalProps {
  open: boolean
  options?: ProductOptions
  onClose: () => void
}

const catalogs: Array<{ id: CatalogType; label: string }> = [
  { id: 'category', label: 'Categorías' },
  { id: 'brand', label: 'Marcas' },
  { id: 'unit', label: 'Unidades' },
]

export function ProductCatalogModal({
  open,
  options,
  onClose,
}: ProductCatalogModalProps) {
  const [type, setType] = useState<CatalogType>('category')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const mutations = useCatalogMutations()
  const pending =
    mutations.category.isPending ||
    mutations.brand.isPending ||
    mutations.unit.isPending
  const items =
    type === 'category'
      ? options?.categories
      : type === 'brand'
        ? options?.brands
        : options?.units

  const save = async () => {
    const cleanName = name.trim()
    if (cleanName.length < 2) {
      toast.error('Ingresa un nombre válido.')
      return
    }
    if (type === 'unit' && !symbol.trim()) {
      toast.error('Ingresa el símbolo de la unidad.')
      return
    }

    try {
      if (type === 'category') await mutations.category.mutateAsync(cleanName)
      if (type === 'brand') await mutations.brand.mutateAsync(cleanName)
      if (type === 'unit')
        await mutations.unit.mutateAsync({
          name: cleanName,
          symbol: symbol.trim(),
        })
      setName('')
      setSymbol('')
      toast.success('Catálogo actualizado.')
    } catch (error) {
      toast.error(getProductErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catálogos de productos"
      description="Administra los datos maestros usados al registrar productos."
      className="max-w-xl"
    >
      <div className="mb-5 flex gap-1 rounded-xl bg-muted p-1">
        {catalogs.map((catalog) => (
          <button
            key={catalog.id}
            type="button"
            onClick={() => setType(catalog.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              type === catalog.id
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {catalog.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={type === 'unit' ? 'Ej. Unidad' : 'Nombre del registro'}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void save()
          }}
        />
        {type === 'unit' && (
          <Input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value)}
            placeholder="Símbolo: und"
            className="sm:w-36"
            onKeyDown={(event) => {
              if (event.key === 'Enter') void save()
            }}
          />
        )}
        <Button type="button" onClick={() => void save()} disabled={pending}>
          <Plus size={16} />
          Agregar
        </Button>
      </div>

      <div className="mt-5 max-h-72 overflow-y-auto rounded-xl border">
        {items?.length ? (
          <ul className="divide-y">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{item.name}</span>
                {'symbol' in item && item.symbol && (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {item.symbol}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aún no hay registros en este catálogo.
          </p>
        )}
      </div>
    </Modal>
  )
}
