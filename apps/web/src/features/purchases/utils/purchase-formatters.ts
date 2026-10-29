import type { PurchaseStatus } from '../types/purchases.types'

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

export const quantityFormatter = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
})

export function purchaseStatusLabel(status: PurchaseStatus): string {
  const labels: Record<PurchaseStatus, string> = {
    DRAFT: 'Borrador',
    RECEIVED: 'Recibida',
    CANCELLED: 'Cancelada',
  }
  return labels[status] ?? status
}

export function purchaseStatusClass(status: PurchaseStatus): string {
  const classes: Record<PurchaseStatus, string> = {
    DRAFT: 'bg-amber-100 text-amber-800 border-amber-200',
    RECEIVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  }
  return classes[status] ?? ''
}

export function formatPurchaseDate(dateStr: string): string {
  try {
    const parts = dateStr.split('-')
    const year = Number(parts[0])
    const month = Number(parts[1])
    const day = Number(parts[2])
    if (!year || !month || !day) return dateStr
    return dateFormatter.format(new Date(year, month - 1, day))
  } catch {
    return dateStr
  }
}

export function getPurchaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response
    if (response?.data?.message) return response.data.message
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
