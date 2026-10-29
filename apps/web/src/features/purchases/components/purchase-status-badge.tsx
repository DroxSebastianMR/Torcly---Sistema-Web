import { cn } from '@/lib/utils'
import type { PurchaseStatus } from '../types/purchases.types'
import {
  purchaseStatusClass,
  purchaseStatusLabel,
} from '../utils/purchase-formatters'

interface PurchaseStatusBadgeProps {
  status: PurchaseStatus
  className?: string
}

export function PurchaseStatusBadge({
  status,
  className,
}: PurchaseStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        purchaseStatusClass(status),
        className,
      )}
    >
      {purchaseStatusLabel(status)}
    </span>
  )
}
