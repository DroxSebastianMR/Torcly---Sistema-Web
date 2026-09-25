import { useDeferredValue, useState } from 'react'
import { Boxes, PackagePlus, Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
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
  const [productToToggle, setProductToToggle] = useState<Product | null>(null)
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
    try {
      await mutations.status.mutateAsync({
        id: product.id,
        active: !product.active,
      })
      toast.success(`Producto ${product.active ? 'desactivado' : 'activado'}.`)
    } catch (error) {
      toast.error(getProductErrorMessage(error))
      throw error
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
          suggestions={visibleProducts.map((product) => ({
            value: product.code,
            label: `${product.name} · ${product.code}`,
          }))}
        />

        {products.isError ? (
          <ErrorState
            title="No se pudo cargar el catálogo"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={products.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void products.refetch(),
            }}
          />
        ) : (
          <ProductsTable
            products={visibleProducts}
            loading={products.isPending}
            onEdit={(product) => {
              setEditingProduct(product)
              setProductFormOpen(true)
            }}
            onToggleStatus={setProductToToggle}
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
      <ConfirmationDialog
        open={Boolean(productToToggle)}
        title={
          productToToggle?.active
            ? '¿Desactivar producto?'
            : '¿Activar producto?'
        }
        description={
          productToToggle?.active
            ? `“${productToToggle.name}” dejará de estar disponible para las operaciones del taller.`
            : `“${productToToggle?.name ?? ''}” volverá a estar disponible para las operaciones del taller.`
        }
        variant={productToToggle?.active ? 'danger' : 'success'}
        confirmLabel={productToToggle?.active ? 'Desactivar' : 'Activar'}
        onCancel={() => setProductToToggle(null)}
        onConfirm={async () => {
          if (!productToToggle) return
          await toggleStatus(productToToggle)
        }}
      />
    </div>
  )
}
