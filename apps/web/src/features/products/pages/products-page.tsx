import { useDeferredValue, useEffect, useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { ProductCatalogModal } from '../components/product-catalog-modal'
import { ProductDetailModal } from '../components/product-detail-modal'
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
  pageSize: 10,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'products:write',
  )
  const [filters, setFilters] = useState(initialFilters)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [productFormOpen, setProductFormOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [productToToggle, setProductToToggle] = useState<Product | null>(null)
  const [categoryFilterOpened, setCategoryFilterOpened] = useState(false)
  const [warmOptions, setWarmOptions] = useState(false)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const products = useProducts(queryFilters)
  const options = useProductOptions(
    productFormOpen || categoryFilterOpened || warmOptions,
  )
  const mutations = useProductMutations()
  const total = products.data?.pagination.total ?? 0
  const totalPages = products.data?.pagination.totalPages ?? 1
  const visibleProducts = products.data?.data ?? []
  const lowStock = visibleProducts.filter((product) => product.lowStock).length

  useEffect(() => {
    if (!products.isSuccess) return

    const timer = window.setTimeout(() => setWarmOptions(true), 500)

    return () => window.clearTimeout(timer)
  }, [products.isSuccess])

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
      setDetailProduct((current) =>
        current?.id === product.id
          ? { ...current, active: !product.active }
          : current,
      )
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
            Catálogo comercial
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Productos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Administra repuestos y productos disponibles para ventas y
            operaciones del taller.
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setCatalogOpen(true)}>
              <Settings2 size={16} /> Catálogos
            </Button>
            <Button onClick={openCreate}>
              <Plus size={17} /> Registrar producto
            </Button>
          </div>
        )}
      </header>

      <ModuleMetrics
        items={[
          { label: 'Productos encontrados', value: total },
          {
            label: 'Con stock bajo en esta página',
            value: lowStock,
            tone: 'warning',
          },
        ]}
      />

      <section
        aria-label="Filtros de productos"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <ProductsToolbar
          filters={filters}
          options={options.data}
          optionsLoading={options.isFetching}
          onCategoryOpen={() => setCategoryFilterOpened(true)}
          onChange={setFilters}
          suggestions={visibleProducts.map((product) => ({
            value: product.code,
            label: `${product.name} · ${product.code}`,
          }))}
        />
      </section>

      <section
        aria-label="Resultados de productos"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
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
            loading={products.isPending || products.isFetching}
            canWrite={canWrite}
            onOpenDetail={setDetailProduct}
            onEdit={(product) => {
              setEditingProduct(product)
              setProductFormOpen(true)
            }}
            onToggleStatus={setProductToToggle}
          />
        )}

        {products.data && (
          <Pagination
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>

      <ProductFormModal
        open={productFormOpen}
        product={editingProduct}
        options={options.data}
        onClose={() => setProductFormOpen(false)}
      />
      <ProductDetailModal
        open={Boolean(detailProduct)}
        product={detailProduct}
        canWrite={canWrite}
        onClose={() => setDetailProduct(null)}
        onEdit={(product) => {
          setDetailProduct(null)
          setEditingProduct(product)
          setProductFormOpen(true)
        }}
        onToggleStatus={setProductToToggle}
      />
      <ProductCatalogModal
        open={catalogOpen}
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
