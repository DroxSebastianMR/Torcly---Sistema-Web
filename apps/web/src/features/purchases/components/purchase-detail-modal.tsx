import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { usePurchase, usePurchaseMutations } from '../hooks/use-purchases'
import type { PurchaseDetail } from '../types/purchases.types'
import {
  currencyFormatter,
  formatPurchaseDate,
  getPurchaseErrorMessage,
  quantityFormatter,
} from '../utils/purchase-formatters'
import { PurchaseStatusBadge } from './purchase-status-badge'

interface PurchaseDetailModalProps {
  purchaseId: string | null
  onClose: () => void
  onEdit?: (purchase: PurchaseDetail) => void
}

export function PurchaseDetailModal({
  purchaseId,
  onClose,
  onEdit,
}: PurchaseDetailModalProps) {
  const { user } = useAuth()
  const canWrite = hasPermission(user?.permissions ?? [], 'purchases:write')
  const purchase = usePurchase(purchaseId ?? '')
  const mutations = usePurchaseMutations()
  const [confirmReceive, setConfirmReceive] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const detail = purchase.data
  const open = Boolean(purchaseId)

  const handleReceive = async () => {
    if (!purchaseId) return
    const requestId = `receive-${purchaseId}-${Date.now()}`
    try {
      await mutations.receivePurchase.mutateAsync({ id: purchaseId, requestId })
      toast.success('Recepción confirmada. El inventario fue actualizado.')
      setConfirmReceive(false)
    } catch (error) {
      toast.error(getPurchaseErrorMessage(error))
    }
  }

  const handleCancel = async () => {
    if (!purchaseId) return
    try {
      await mutations.cancelPurchase.mutateAsync(purchaseId)
      toast.success('Compra cancelada.')
      setConfirmCancel(false)
      onClose()
    } catch (error) {
      toast.error(getPurchaseErrorMessage(error))
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Detalle de compra">
        {purchase.isLoading && (
          <div className="flex min-h-48 items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {purchase.isError && (
          <ErrorState
            title="No se pudo cargar la compra"
            action={{ label: 'Reintentar', onClick: () => purchase.refetch() }}
          />
        )}

        {detail && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-semibold text-primary">
                  {detail.code}
                </p>
                <p className="mt-0.5 text-lg font-bold">
                  {detail.supplier.legalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {detail.supplier.documentNumber}
                </p>
              </div>
              <PurchaseStatusBadge status={detail.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-muted/40 px-4 py-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Fecha</dt>
                <dd className="font-medium">
                  {formatPurchaseDate(detail.purchaseDate)}
                </dd>
              </div>
              {detail.externalRef && (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Ref. externa
                  </dt>
                  <dd className="font-medium">{detail.externalRef}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">
                  Registrado por
                </dt>
                <dd className="font-medium">{detail.performedBy}</dd>
              </div>
              {detail.receivedBy && (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Recibido por
                  </dt>
                  <dd className="font-medium">
                    {detail.receivedBy}
                    {detail.receivedAt && (
                      <span className="block text-xs text-muted-foreground">
                        {formatPurchaseDate(
                          detail.receivedAt.split('T')[0] ?? '',
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {detail.cancelledBy && (
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Cancelado por
                  </dt>
                  <dd className="font-medium text-destructive">
                    {detail.cancelledBy}
                    {detail.cancelledAt && (
                      <span className="block text-xs text-muted-foreground">
                        {formatPurchaseDate(
                          detail.cancelledAt.split('T')[0] ?? '',
                        )}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {detail.notes && (
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Notas</dt>
                  <dd className="font-medium">{detail.notes}</dd>
                </div>
              )}
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Líneas de compra ({detail.lines.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Producto</th>
                      <th className="px-3 py-2.5 text-right">Cant.</th>
                      <th className="px-3 py-2.5 text-right">Costo Unit.</th>
                      <th className="px-3 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {detail.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{line.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {line.productCode}
                            {line.unitLabel && ` · ${line.unitLabel}`}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {quantityFormatter.format(line.quantity)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          {currencyFormatter.format(line.unitCost)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold">
                          {currencyFormatter.format(line.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/20">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2.5 text-right text-base font-bold text-primary">
                        {currencyFormatter.format(detail.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {canWrite && detail.status === 'DRAFT' && (
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                {onEdit && (
                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs"
                    onClick={() => {
                      onClose()
                      onEdit(detail)
                    }}
                  >
                    Editar borrador
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 px-3 text-xs gap-1.5"
                  onClick={() => setConfirmCancel(true)}
                >
                  <XCircle size={14} />
                  Cancelar compra
                </Button>
                <Button
                  className="h-8 px-3 text-xs gap-1.5"
                  onClick={() => setConfirmReceive(true)}
                >
                  <CheckCircle size={14} />
                  Confirmar recepción
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmationDialog
        open={confirmReceive}
        variant="success"
        title="Confirmar recepción"
        description="Esto aumentará las existencias de inventario con movimientos de ENTRADA. La compra quedará inmutable. ¿Deseas continuar?"
        confirmLabel="Confirmar recepción"
        pending={mutations.receivePurchase.isPending}
        onConfirm={handleReceive}
        onCancel={() => setConfirmReceive(false)}
      />

      <ConfirmationDialog
        open={confirmCancel}
        variant="danger"
        title="Cancelar compra"
        description="La compra pasará a estado cancelado y no afectará el inventario ni podrá volver a editarse. ¿Deseas continuar?"
        confirmLabel="Sí, cancelar"
        pending={mutations.cancelPurchase.isPending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </>
  )
}
