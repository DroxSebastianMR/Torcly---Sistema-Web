import { useState } from 'react'
import { Check, Pencil, Plus, Power, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useCatalogMutations, useProductCatalog } from '../hooks/use-products'
import type { CatalogItem } from '../types/products.types'
import { getProductErrorMessage } from '../utils/product-formatters'

type CatalogType = 'category' | 'brand' | 'unit'

interface ProductCatalogModalProps {
  open: boolean
  onClose: () => void
}

const catalogs: Array<{ id: CatalogType; label: string }> = [
  { id: 'category', label: 'Categorías' },
  { id: 'brand', label: 'Marcas' },
  { id: 'unit', label: 'Unidades' },
]

export function ProductCatalogModal({
  open,
  onClose,
}: ProductCatalogModalProps) {
  const [type, setType] = useState<CatalogType>('category')
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingSymbol, setEditingSymbol] = useState('')
  const mutations = useCatalogMutations()
  const catalog = useProductCatalog(open)
  const pending =
    mutations.category.isPending ||
    mutations.brand.isPending ||
    mutations.unit.isPending
  const items =
    type === 'category'
      ? catalog.data?.categories
      : type === 'brand'
        ? catalog.data?.brands
        : catalog.data?.units
  const visibleItems = items

  const changeType = (nextType: CatalogType) => {
    setType(nextType)
    setEditingId(null)
    setEditingName('')
    setEditingSymbol('')
  }

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

  const startEditing = (item: CatalogItem) => {
    setEditingId(item.id)
    setEditingName(item.name)
    setEditingSymbol(item.symbol ?? '')
  }

  const saveEdit = async () => {
    const cleanName = editingName.trim()
    if (!editingId || cleanName.length < 2) {
      toast.error('Ingresa un nombre válido.')
      return
    }
    if (type === 'unit' && !editingSymbol.trim()) {
      toast.error('Ingresa el símbolo de la unidad.')
      return
    }

    try {
      if (type === 'category')
        await mutations.updateCategory.mutateAsync({
          id: editingId,
          name: cleanName,
        })
      if (type === 'brand')
        await mutations.updateBrand.mutateAsync({
          id: editingId,
          name: cleanName,
        })
      if (type === 'unit')
        await mutations.updateUnit.mutateAsync({
          id: editingId,
          name: cleanName,
          symbol: editingSymbol.trim(),
        })
      setEditingId(null)
      toast.success('Registro actualizado.')
    } catch (error) {
      toast.error(getProductErrorMessage(error))
    }
  }

  const toggleStatus = async (item: CatalogItem) => {
    try {
      if (type === 'category')
        await mutations.updateCategoryStatus.mutateAsync({
          id: item.id,
          active: !item.active,
        })
      if (type === 'brand')
        await mutations.updateBrandStatus.mutateAsync({
          id: item.id,
          active: !item.active,
        })
      if (type === 'unit')
        await mutations.updateUnitStatus.mutateAsync({
          id: item.id,
          active: !item.active,
        })
      toast.success(`Registro ${item.active ? 'desactivado' : 'activado'}.`)
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
            onClick={() => changeType(catalog.id)}
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
        {visibleItems?.length ? (
          <ul className="divide-y">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                {editingId === item.id ? (
                  <div className="flex min-w-0 flex-1 gap-2">
                    <Input
                      aria-label="Nombre del registro"
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                    {type === 'unit' && (
                      <Input
                        aria-label="Símbolo de la unidad"
                        value={editingSymbol}
                        onChange={(event) =>
                          setEditingSymbol(event.target.value)
                        }
                        className="w-24"
                      />
                    )}
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        !item.active ? 'text-muted-foreground line-through' : ''
                      }
                    >
                      {item.name}
                    </span>
                    {'symbol' in item && item.symbol && (
                      <span className="ml-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {item.symbol}
                      </span>
                    )}
                  </div>
                )}
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.active ? 'Activo' : 'Inactivo'}
                </span>
                <div className="flex shrink-0 gap-1">
                  {editingId === item.id ? (
                    <>
                      <button
                        type="button"
                        aria-label="Guardar edición"
                        onClick={() => void saveEdit()}
                        className="flex size-9 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label="Cancelar edición"
                        onClick={() => setEditingId(null)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={`Editar ${item.name}`}
                        onClick={() => startEditing(item)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`${item.active ? 'Desactivar' : 'Activar'} ${item.name}`}
                        onClick={() => void toggleStatus(item)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Power size={16} />
                      </button>
                    </>
                  )}
                </div>
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
