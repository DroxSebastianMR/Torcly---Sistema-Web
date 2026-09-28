import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  PackageOpen,
  Pencil,
  Power,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { paths } from '@/app/router/constants/paths'
import { hasPermission } from '@/lib/permissions'
import { dateFormatter } from '@/features/customers/utils/customer-formatters'
import {
  useProduct,
  useProductMutations,
  useProductOptions,
} from '../hooks/use-products'
import type { Product } from '../types/products.types'
import {
  currencyFormatter,
  getProductErrorMessage,
  numberFormatter,
} from '../utils/product-formatters'
import { ProductFormModal } from '../components/product-form-modal'

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'products:write',
  )
  const product = useProduct(id ?? '')
  const options = useProductOptions()
  const mutations = useProductMutations()
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [productToToggle, setProductToToggle] = useState<Product | null>(null)

  if (product.isPending) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="flex animate-pulse items-center gap-4">
          <div className="size-16 rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (product.isError || !product.data) {
    return (
      <ErrorState
        title="No se pudo cargar la ficha del producto"
        description="Verifica que exista un producto con este identificador e inténtalo nuevamente."
        busy={product.isFetching}
        action={{
          label: 'Reintentar',
          onClick: () => void product.refetch(),
        }}
      />
    )
  }

  const details = product.data

  const toggleStatus = async () => {
    try {
      await mutations.status.mutateAsync({
        id: details.id,
        active: !details.active,
      })
      toast.success(`Producto ${details.active ? 'desactivado' : 'activado'}.`)
    } catch (error) {
      toast.error(getProductErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate(paths.products)}>
          <ArrowLeft size={16} /> Volver a productos
        </Button>
        {canWrite && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              aria-label={`${details.active ? 'Desactivar' : 'Activar'} producto`}
              onClick={() => setProductToToggle(details)}
            >
              <Power size={16} />
              {details.active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(details)
                setFormOpen(true)
              }}
            >
              <Pencil size={16} /> Editar producto
            </Button>
          </div>
        )}
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_10px_35px_rgba(16,44,37,0.04)] sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Boxes size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-brand-forest">
              {details.name}
            </h1>
            <StatusBadge active={details.active} />
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {details.code}
            {details.barcode ? ` · ${details.barcode}` : ''}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <header className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
            Datos del producto
          </h2>
        </header>
        <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
          <Datum label="Código" value={details.code} mono />
          <Datum
            label="Código de barras"
            value={details.barcode ?? 'Sin registro'}
          />
          <Datum label="Categoría" value={details.category.name} />
          <Datum label="Marca" value={details.brand?.name ?? 'Sin marca'} />
          <Datum
            label="Unidad"
            value={`${details.unit.name} (${details.unit.symbol})`}
          />
          <Datum
            label="Precio de venta"
            value={currencyFormatter.format(details.salePrice)}
          />
          <Datum
            label="Stock mínimo"
            value={`${numberFormatter.format(details.minimumStock)} ${details.unit.symbol}`}
          />
          <Datum
            label="Descripción"
            value={details.description ?? 'Sin descripción'}
          />
          <Datum label="Registrado" value={dateFormatter(details.createdAt)} />
          <Datum
            label="Última actualización"
            value={dateFormatter(details.updatedAt)}
          />
        </dl>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <header className="flex items-center gap-2 border-b px-5 py-4">
          <PackageOpen size={16} className="text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
            Existencia disponible
          </h2>
        </header>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-5">
          <p className="text-4xl font-bold tabular-nums text-brand-forest">
            {numberFormatter.format(details.stock)}
            <span className="ml-2 text-base font-medium text-muted-foreground">
              {details.unit.symbol}
            </span>
          </p>
          {details.lowStock && (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertTriangle size={15} /> El stock está por debajo del mínimo
              configurado.
            </p>
          )}
          <p className="ml-auto text-xs text-muted-foreground sm:text-sm">
            Solo lectura · las existencias se administran desde Inventario.
          </p>
        </div>
      </section>

      <ProductFormModal
        open={formOpen}
        product={editingProduct}
        options={options.data}
        onClose={() => setFormOpen(false)}
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
            ? `“${productToToggle?.name ?? ''}” dejará de estar disponible para las operaciones del taller.`
            : `“${productToToggle?.name ?? ''}” volverá a estar disponible para las operaciones del taller.`
        }
        variant={productToToggle?.active ? 'danger' : 'success'}
        confirmLabel={productToToggle?.active ? 'Desactivar' : 'Activar'}
        onCancel={() => setProductToToggle(null)}
        onConfirm={async () => {
          await toggleStatus()
          setProductToToggle(null)
        }}
      />
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function Datum({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-medium ${mono ? 'font-mono font-bold' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
