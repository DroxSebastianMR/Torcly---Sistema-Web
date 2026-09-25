import { Pencil, Receipt, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { SaleDetail, SaleLine } from '../types/sales.types'
import {
  currencyFormatter,
  dateTimeFormatter,
  quantityFormatter,
  saleStatusLabel,
} from '../utils/sale-formatters'

interface SaleDetailModalProps {
  open: boolean
  sale: SaleDetail | null
  loading: boolean
  canEdit: boolean
  onClose: () => void
  onEdit: (sale: SaleDetail) => void
}

export function SaleDetailModal({
  open,
  sale,
  loading,
  canEdit,
  onClose,
  onEdit,
}: SaleDetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sale?.code ?? 'Detalle de venta'}
      description={
        sale ? `Venta ${saleStatusLabel(sale.status).toLowerCase()}` : undefined
      }
      className="max-w-3xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {sale && sale.status === 'DRAFT' && canEdit && (
            <Button type="button" onClick={() => onEdit(sale)}>
              <Pencil size={16} /> Editar venta
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {loading || !sale ? (
        <DetailSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={<UserRound aria-hidden size={15} />}
              label="Cliente"
              value={
                sale.customer
                  ? `${sale.customer.name} · ${sale.customer.documentNumber}`
                  : 'Venta sin cliente'
              }
            />
            <InfoItem
              icon={<Receipt aria-hidden size={15} />}
              label="Registrada por"
              value={sale.performedBy}
            />
            <InfoItem
              label="Fecha de registro"
              value={dateTimeFormatter.format(new Date(sale.createdAt))}
            />
            <InfoItem
              label="Confirmada por"
              value={
                sale.confirmedBy
                  ? `${sale.confirmedBy} · ${dateTimeFormatter.format(
                      new Date(sale.confirmedAt ?? sale.createdAt),
                    )}`
                  : 'Pendiente de confirmación'
              }
            />
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="hidden divide-y md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-right">Precio</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sale.lines.map((line) => (
                    <LineRow key={line.id} line={line} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y md:hidden">
              {sale.lines.map((line) => (
                <LineCard key={line.id} line={line} />
              ))}
            </div>
            <div className="flex items-center justify-between border-t bg-[#f8faf9] px-4 py-3 text-sm">
              <span className="font-medium text-muted-foreground">
                {sale.lineCount} {sale.lineCount === 1 ? 'línea' : 'líneas'} de
                venta
              </span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold tabular-nums text-brand-forest">
                  {currencyFormatter.format(sale.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

function LineRow({ line }: { line: SaleLine }) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium">{line.name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
          {line.code}
        </p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {currencyFormatter.format(line.unitPrice)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {quantityFormatter.format(line.quantity)}
        {line.unitLabel ? ` ${line.unitLabel}` : ''}
      </td>
      <td className="px-4 py-3 text-right font-semibold tabular-nums">
        {currencyFormatter.format(line.subtotal)}
      </td>
    </tr>
  )
}

function LineCard({ line }: { line: SaleLine }) {
  return (
    <div className="px-4 py-3">
      <p className="font-medium">{line.name}</p>
      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
        {line.code}
      </p>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {currencyFormatter.format(line.unitPrice)} ×{' '}
          {quantityFormatter.format(line.quantity)}
          {line.unitLabel ? ` ${line.unitLabel}` : ''}
        </span>
        <span className="font-semibold tabular-nums">
          {currencyFormatter.format(line.subtotal)}
        </span>
      </div>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando venta">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
      <div className="h-12 w-40 animate-pulse self-end rounded-xl bg-muted" />
    </div>
  )
}
