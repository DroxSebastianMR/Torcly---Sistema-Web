import { useState } from 'react'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useSaleMutations } from '../hooks/use-sales'
import type { SaleDetail } from '../types/sales.types'
import { getSaleErrorMessage } from '../utils/sale-formatters'

interface SaleCancelModalProps {
  open: boolean
  sale: SaleDetail | null
  onClose: () => void
}

export function SaleCancelModal({ open, sale, onClose }: SaleCancelModalProps) {
  const { cancel } = useSaleMutations()
  const [reason, setReason] = useState('')

  const close = () => {
    setReason('')
    onClose()
  }

  const submit = async () => {
    if (!sale) return
    const normalizedReason = reason.trim()
    if (normalizedReason.length < 3) {
      toast.error('Indica el motivo de la anulación.')
      return
    }
    try {
      await cancel.mutateAsync({
        id: sale.id,
        input: { reason: normalizedReason },
      })
      toast.success(
        sale.status === 'CONFIRMED'
          ? 'Venta anulada y existencias repuestas.'
          : 'Borrador anulado correctamente.',
      )
      close()
    } catch (error) {
      toast.error(getSaleErrorMessage(error))
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Anular venta"
      description={
        sale?.status === 'CONFIRMED'
          ? 'Las existencias de los productos se repondrán. Si hay cobros, compénsalos primero desde Caja.'
          : 'El borrador se conservará como anulado para mantener la trazabilidad.'
      }
      visual={
        <span className="flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 ring-8 ring-rose-50/80 sm:size-14">
          <Ban aria-hidden className="size-6 sm:size-7" />
        </span>
      }
      busy={cancel.isPending}
      className="max-w-lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={cancel.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={cancel.isPending || reason.trim().length < 3}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {cancel.isPending ? 'Anulando…' : 'Anular venta'}
          </Button>
        </div>
      }
    >
      <label
        className="block text-sm font-medium text-foreground"
        htmlFor="sale-cancellation-reason"
      >
        Motivo de la anulación
      </label>
      <textarea
        id="sale-cancellation-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={300}
        rows={3}
        placeholder="Ej. El cliente desistió de la compra."
        className="mt-2 w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
      />
    </Modal>
  )
}
