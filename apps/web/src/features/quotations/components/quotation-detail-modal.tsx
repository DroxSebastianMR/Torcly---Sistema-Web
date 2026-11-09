import {
  MessageCircle,
  Wrench,
  User,
  Car,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { QuotationDetail } from '../types/quotations.types'
import {
  currencyFormatter,
  dateFormatter,
  openQuotationWhatsApp,
  quotationStatusConfig,
} from '../utils/quotation-formatters'

interface QuotationDetailModalProps {
  open: boolean
  quotation: QuotationDetail | null
  loading?: boolean
  workshopName?: string
  onClose: () => void
  onConvertToOrder: (quotation: QuotationDetail) => void
}

export function QuotationDetailModal({
  open,
  quotation,
  loading = false,
  workshopName,
  onClose,
  onConvertToOrder,
}: QuotationDetailModalProps) {
  if (!quotation) return null

  const statusCfg = quotationStatusConfig[quotation.status]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Presupuesto ${quotation.code}`}
      description={`Registrado el ${dateFormatter.format(new Date(quotation.createdAt))} por ${quotation.createdBy}`}
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => openQuotationWhatsApp(quotation, workshopName)}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            <MessageCircle size={16} className="mr-1.5 text-emerald-600" />
            Enviar por WhatsApp
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {quotation.status !== 'APPROVED' ? (
              <Button
                type="button"
                loading={loading}
                onClick={() => onConvertToOrder(quotation)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Wrench size={16} className="mr-1.5" />
                Convertir a Orden
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={15} /> Convertida a Orden
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Encabezado con estado y total */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div>
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.tone}`}
            >
              {statusCfg.label}
            </span>
            {quotation.validUntil && (
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={13} />
                Válido hasta: {dateFormatter.format(new Date(quotation.validUntil))}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Total Presupuestado</span>
            <p className="text-2xl font-black text-brand-forest tabular-nums">
              {currencyFormatter.format(quotation.total)}
            </p>
          </div>
        </div>

        {/* Tarjetas de Cliente y Vehículo */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <User size={14} /> Cliente
            </p>
            <p className="text-sm font-semibold text-foreground">
              {quotation.customer ? quotation.customer.name : 'Sin cliente asignado'}
            </p>
            {quotation.customer && (
              <p className="font-mono text-xs text-muted-foreground">
                {quotation.customer.phone || quotation.customer.documentNumber}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Car size={14} /> Vehículo
            </p>
            <p className="text-sm font-semibold text-foreground">
              {quotation.vehicle
                ? `${quotation.vehicle.brand} ${quotation.vehicle.model}`
                : 'Vehículo tentativo'}
            </p>
            <p className="font-mono text-xs font-bold text-primary">
              {quotation.vehicle?.plate || quotation.vehiclePlate || 'Sin placa'}
            </p>
          </div>
        </div>

        {/* Tabla de ítems presupuestados */}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
              <tr>
                <th className="px-4 py-2.5">Ítem</th>
                <th className="px-4 py-2.5 text-right">Cant.</th>
                <th className="px-4 py-2.5 text-right">Precio Unit.</th>
                <th className="px-4 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotation.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.code} · {item.type === 'PRODUCT' ? 'Repuesto' : 'Mano de obra'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {item.quantity} {item.unitLabel || ''}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {currencyFormatter.format(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                    {currencyFormatter.format(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Observaciones */}
        {quotation.notes && (
          <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            <p className="font-bold uppercase tracking-wider text-foreground mb-1 flex items-center gap-1">
              <FileText size={13} /> Notas del presupuesto
            </p>
            <p>{quotation.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
