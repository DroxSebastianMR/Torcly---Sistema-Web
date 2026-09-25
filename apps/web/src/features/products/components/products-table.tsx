import {
  AlertTriangle,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Power,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { Product } from '../types/products.types'
import { currencyFormatter, numberFormatter } from '../utils/product-formatters'

interface ProductsTableProps {
  products: Product[]
  loading: boolean
  onEdit: (product: Product) => void
  onToggleStatus: (product: Product) => void
}

export function ProductsTable({
  products,
  loading,
  onEdit,
  onToggleStatus,
}: ProductsTableProps) {
  if (loading) return <ProductsSkeleton />

  if (!products.length) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No se encontraron productos"
        description="Ajusta los filtros o registra el primer producto del catálogo."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-4 py-3">Categoría / Marca</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Existencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="w-16 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => (
              <tr key={product.id} className="group hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-xs font-bold text-primary">
                      {product.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="block max-w-64 truncate text-left font-semibold text-foreground hover:text-primary"
                      >
                        {product.name}
                      </button>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {product.code}
                        {product.barcode ? ` · ${product.barcode}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{product.category.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product.brand?.name ?? 'Sin marca'}
                  </p>
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">
                  {currencyFormatter.format(product.salePrice)}
                </td>
                <td className="px-4 py-4 text-right">
                  <p className="font-semibold tabular-nums">
                    {numberFormatter.format(product.stock)}{' '}
                    {product.unit.symbol}
                  </p>
                  {product.lowStock && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertTriangle size={12} /> Stock bajo
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge active={product.active} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      title="Editar producto"
                      aria-label={`Editar ${product.name}`}
                      onClick={() => onEdit(product)}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      title={
                        product.active
                          ? 'Desactivar producto'
                          : 'Activar producto'
                      }
                      aria-label={`${product.active ? 'Desactivar' : 'Activar'} ${product.name}`}
                      onClick={() => onToggleStatus(product)}
                      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {products.map((product) => (
          <article key={product.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{product.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {product.code}
                </p>
              </div>
              <StatusBadge active={product.active} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Categoría" value={product.category.name} />
              <Info
                label="Precio"
                value={currencyFormatter.format(product.salePrice)}
              />
              <Info
                label="Existencia"
                value={`${numberFormatter.format(product.stock)} ${product.unit.symbol}`}
                warning={product.lowStock}
              />
              <Info label="Marca" value={product.brand?.name ?? 'Sin marca'} />
            </div>
            <div className="mt-4 flex gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium"
              >
                <Pencil size={15} /> Editar
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus(product)}
                className="flex size-10 items-center justify-center rounded-lg border"
                aria-label={`${product.active ? 'Desactivar' : 'Activar'} ${product.name}`}
              >
                <Power size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
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

function Info({
  label,
  value,
  warning,
}: {
  label: string
  value: string
  warning?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-medium ${warning ? 'text-amber-700' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function ProductsSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando productos">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-28 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
