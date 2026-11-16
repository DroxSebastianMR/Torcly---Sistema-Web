import { Eye, MessageCircle, Wrench, CheckCircle2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import { TableActionButton } from '@/components/ui/table-action-button'
import type { QuotationSummary } from '../types/quotations.types'
import {
  currencyFormatter,
  dateFormatter,
  openQuotationWhatsApp,
  quotationStatusConfig,
} from '../utils/quotation-formatters'

interface QuotationsTableProps {
  quotations: QuotationSummary[]
  loading?: boolean
  workshopName?: string
  onOpen: (quotation: QuotationSummary) => void
  onConvertToOrder: (quotation: QuotationSummary) => void
}

export function QuotationsTable({
  quotations,
  loading = false,
  workshopName,
  onOpen,
  onConvertToOrder,
}: QuotationsTableProps) {
  if (loading) return <TableSkeleton columns={7} />

  if (!loading && quotations.length === 0) {
    return (
      <EmptyState
        title="No hay cotizaciones registradas"
        description="Elabora un nuevo presupuesto para enviar a tus clientes por WhatsApp y convertirlo a orden de taller."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Vehículo / Placa</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3">Vigencia</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotations.map((quotation) => {
              const statusCfg = quotationStatusConfig[quotation.status]
              const vehicleLabel = quotation.vehicle
                ? `${quotation.vehicle.brand} ${quotation.vehicle.model}`
                : 'Vehículo por confirmar'
              const plateLabel =
                quotation.vehicle?.plate ||
                quotation.vehiclePlate ||
                'Sin placa'

              return (
                <tr
                  key={quotation.id}
                  onClick={() => onOpen(quotation)}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-4 font-mono font-semibold text-primary">
                    {quotation.code}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-foreground">
                      {quotation.customer
                        ? quotation.customer.name
                        : 'Sin cliente'}
                    </p>
                    {quotation.customer && (
                      <p className="font-mono text-xs text-muted-foreground">
                        {quotation.customer.phone ||
                          quotation.customer.documentNumber}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-foreground">
                      {vehicleLabel}
                    </p>
                    <span className="inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold uppercase">
                      {plateLabel}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-bold tabular-nums text-foreground">
                    {currencyFormatter.format(quotation.total)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.tone}`}
                    >
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {quotation.validUntil
                      ? dateFormatter.format(new Date(quotation.validUntil))
                      : 'Sin límite'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Botón WhatsApp */}
                      <TableActionButton
                        onClick={() =>
                          openQuotationWhatsApp(quotation, workshopName)
                        }
                        label="Enviar por WhatsApp"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle size={15} className="text-emerald-600" />
                      </TableActionButton>

                      {/* Botón Convertir a Orden */}
                      {quotation.status !== 'APPROVED' ? (
                        <TableActionButton
                          onClick={() => onConvertToOrder(quotation)}
                          label="Convertir a Orden de Taller"
                          title="Convertir a Orden de Taller"
                        >
                          <Wrench size={15} className="text-amber-600" />
                        </TableActionButton>
                      ) : (
                        <span
                          className="flex size-8 items-center justify-center text-emerald-600"
                          title="Convertida a Orden"
                        >
                          <CheckCircle2 size={16} />
                        </span>
                      )}

                      {/* Botón Ver Detalle */}
                      <TableActionButton
                        onClick={() => onOpen(quotation)}
                        label="Ver detalle"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </TableActionButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Responsive para Móviles */}
      <div className="divide-y divide-border md:hidden">
        {quotations.map((quotation) => {
          const statusCfg = quotationStatusConfig[quotation.status]
          const plateLabel =
            quotation.vehicle?.plate || quotation.vehiclePlate || 'Sin placa'

          return (
            <article
              key={quotation.id}
              className="p-4 transition-colors hover:bg-muted/40 cursor-pointer"
              onClick={() => onOpen(quotation)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {quotation.code}
                  </span>
                  <p className="mt-0.5 font-semibold text-foreground">
                    {quotation.customer?.name || 'Sin cliente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Placa: {plateLabel}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusCfg.tone}`}
                >
                  {statusCfg.label}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-base font-bold text-foreground">
                  {currencyFormatter.format(quotation.total)}
                </span>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <TableActionButton
                    onClick={() =>
                      openQuotationWhatsApp(quotation, workshopName)
                    }
                    label="WhatsApp"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle size={15} className="text-emerald-600" />
                  </TableActionButton>
                  {quotation.status !== 'APPROVED' && (
                    <TableActionButton
                      onClick={() => onConvertToOrder(quotation)}
                      label="Convertir a Orden"
                      title="Convertir a Orden"
                    >
                      <Wrench size={15} className="text-amber-600" />
                    </TableActionButton>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
