import { Pencil, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { dateFormatter } from '@/features/customers/utils/customer-formatters'
import { cn } from '@/lib/utils'
import type { Product } from '../types/products.types'
import { currencyFormatter, numberFormatter } from '../utils/product-formatters'

interface ProductDetailModalProps {
  open: boolean
  product: Product | null
  canWrite: boolean
  onClose: () => void
  onEdit: (product: Product) => void
  onToggleStatus: (product: Product) => void
}

export function ProductDetailModal({
  open,
  product,
  canWrite,
  onClose,
  onEdit,
  onToggleStatus,
}: ProductDetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product?.name ?? 'Detalle del producto'}
      description={
        product
          ? 'Información comercial, existencias y trazabilidad del producto.'
          : undefined
      }
      className="max-w-3xl"
      footer={
        product && canWrite ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onToggleStatus(product)}
            >
              <Power size={16} />
              {product.active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button type="button" onClick={() => onEdit(product)}>
              <Pencil size={16} /> Editar producto
            </Button>
          </div>
        ) : undefined
      }
    >
      {product && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dce9e2] bg-[#f5f9f7] px-4 py-3.5 sm:px-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Existencia disponible
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-brand-forest">
                {numberFormatter.format(product.stock)}
                <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                  {product.unit.symbol}
                </span>
              </p>
            </div>
            {product.lowStock && (
              <p className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                Stock bajo: mínimo{' '}
                {numberFormatter.format(product.minimumStock)}{' '}
                {product.unit.symbol}
              </p>
            )}
          </div>

          <dl className="grid overflow-hidden rounded-2xl border border-[#dce9e2] sm:grid-cols-2">
            <Datum label="Código" value={product.code} mono bordered />
            <Datum label="Categoría" value={product.category.name} bordered />
            <Datum label="Marca" value={product.brand?.name ?? 'Sin marca'} />
            <Datum
              label="Unidad"
              value={`${product.unit.name} (${product.unit.symbol})`}
              bordered
            />
            <Datum
              label="Precio de venta"
              value={currencyFormatter.format(product.salePrice)}
              emphasis
            />
            <Datum
              label="Stock mínimo"
              value={`${numberFormatter.format(product.minimumStock)} ${product.unit.symbol}`}
              bordered
            />
            <Datum
              label="Estado"
              value={product.active ? 'Activo' : 'Inactivo'}
              emphasis={product.active}
            />
            <Datum
              label="Descripción"
              value={product.description ?? 'Sin descripción'}
              full
            />
            <Datum
              label="Registrado"
              value={dateFormatter(product.createdAt)}
              bordered
            />
            <Datum
              label="Última actualización"
              value={dateFormatter(product.updatedAt)}
            />
          </dl>
        </div>
      )}
    </Modal>
  )
}

function Datum({
  label,
  value,
  mono,
  bordered,
  full,
  emphasis,
}: {
  label: string
  value: string
  mono?: boolean
  bordered?: boolean
  full?: boolean
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        'border-b border-[#e4ede8] px-4 py-3.5 last:border-b-0 sm:px-5',
        bordered && 'sm:border-r sm:border-[#e4ede8]',
        full && 'sm:col-span-2',
      )}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'mt-1.5 text-[15px] font-bold leading-6 text-foreground',
          mono && 'font-mono tracking-tight',
          emphasis && 'font-semibold text-brand-forest',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
