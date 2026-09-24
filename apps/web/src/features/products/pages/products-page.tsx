import { useDeferredValue, useState } from 'react'
import { Boxes, PackagePlus, Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductCatalogModal } from '../components/product-catalog-modal'
import { ProductFormModal } from '../components/product-form-modal'
import { ProductsTable } from '../components/products-table'
import { ProductsToolbar } from '../components/products-toolbar'
import {
  useProductOptions,
  useProducts,
  useProductMutations,
} from '../hooks/use-products'
import type { Product, ProductFilters } from '../types/products.types'
import { getProductErrorMessage } from '../utils/product-formatters'

const initialFilters: ProductFilters = {
  search: '',
  categoryId: '',
  status: 'all',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const [filters, setFilters] = useState(initialFilters)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const products = useProducts(queryFilters)
  const options = useProductOptions()
  const mutations = useProductMutations()
  const total = products.data?.pagination.total ?? 0
  const visibleProducts = products.data?.data ?? []
  const lowStock = visibleProducts.filter((product) => product.lowStock).length

  const openCreate = () => {
    setEditingProduct(null)
    setProductFormOpen(true)
  }

  const toggleStatus = async (product: Product) => {
    const action = product.active ? 'desactivar' : 'activar'
    if (!window.confirm(`¿Deseas ${action} el producto “${product.name}”?`))
      return

    try {
      await mutations.status.mutateAsync({
        id: product.id,
        active: !product.active,
      })
      toast.success(`Producto ${product.active ? 'desactivado' : 'activado'}.`)
    } catch (error) {
      toast.error(getProductErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Boxes size={15} /> Catálogo comercial
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Productos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Administra repuestos y productos disponibles para ventas y
            operaciones del taller.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setCatalogOpen(true)}>
            <Settings2 size={16} /> Catálogos
          </Button>
          <Button onClick={openCreate}>
            <Plus size={17} /> Registrar producto
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackagePlus size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                productos encontrados
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-amber-700">
              {lowStock}
            </p>
            <p className="text-xs text-muted-foreground">
              con stock bajo en esta página
            </p>
          </div>
          {products.isFetching && !products.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

        <ProductsToolbar
          filters={filters}
          options={options.data}
          onChange={setFilters}
        />

        {products.isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <p className="font-semibold">No se pudo cargar el catálogo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verifica la conexión con la API e inténtalo nuevamente.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => void products.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <ProductsTable
            products={visibleProducts}
            loading={products.isPending}
            onEdit={(product) => {
              setEditingProduct(product)
              setProductFormOpen(true)
            }}
            onToggleStatus={(product) => void toggleStatus(product)}
          />
        )}

        {products.data && products.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {products.data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={filters.page >= products.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Siguiente
              </Button>
            </div>
          </footer>
        )}
      </section>

      <ProductFormModal
        open={productFormOpen}
        product={editingProduct}
        options={options.data}
        onClose={() => setProductFormOpen(false)}
      />
      <ProductCatalogModal
        open={catalogOpen}
        options={options.data}
        onClose={() => setCatalogOpen(false)}
      />
    </div>
  )
}
