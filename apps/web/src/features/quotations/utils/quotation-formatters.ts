import type {
  QuotationDetail,
  QuotationStatus,
  QuotationSummary,
} from '../types/quotations.types'

export const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

export const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export const quotationStatusConfig: Record<
  QuotationStatus,
  { label: string; tone: string }
> = {
  DRAFT: {
    label: 'Borrador',
    tone: 'bg-muted text-muted-foreground border-border',
  },
  SENT: {
    label: 'Enviada',
    tone: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  APPROVED: {
    label: 'Aprobada',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  EXPIRED: {
    label: 'Vencida',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  REJECTED: {
    label: 'Rechazada',
    tone: 'bg-rose-50 text-rose-800 border-rose-200',
  },
}

export function generateQuotationWhatsAppMessage(
  quotation: QuotationSummary | QuotationDetail,
  workshopName = 'Torcly Taller',
): string {
  const customerName = quotation.customer?.name || 'Cliente'
  const vehicle = quotation.vehicle
    ? `${quotation.vehicle.brand} ${quotation.vehicle.model} (${quotation.vehicle.plate})`
    : quotation.vehiclePlate || 'tu vehículo'
  const validText = quotation.validUntil
    ? `· Válido hasta: ${dateFormatter.format(new Date(quotation.validUntil))}\n`
    : ''

  return (
    `Hola ${customerName}, te saludamos de *${workshopName}*.\n\n` +
    `Te compartimos el presupuesto para ${vehicle}:\n` +
    `· N° Cotización: *${quotation.code}*\n` +
    `· Total: *${currencyFormatter.format(quotation.total)}*\n` +
    validText +
    (quotation.notes ? `· Observaciones: ${quotation.notes}\n` : '') +
    `\nQuedamos atentos a tu confirmación para coordinar los trabajos. ¡Muchas gracias!`
  )
}

export function openQuotationWhatsApp(
  quotation: QuotationSummary | QuotationDetail,
  workshopName = 'Torcly Taller',
) {
  const rawPhone = quotation.customer?.phone?.replace(/\D/g, '') || ''
  const cleanPhone = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone
  const message = generateQuotationWhatsAppMessage(quotation, workshopName)
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}
