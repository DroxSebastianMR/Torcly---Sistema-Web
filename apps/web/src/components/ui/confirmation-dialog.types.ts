import type { LucideIcon } from 'lucide-react'

export type ConfirmationVariant = 'danger' | 'success' | 'info'

export interface ConfirmationDialogProps {
  open: boolean
  title: string
  description?: string
  variant?: ConfirmationVariant
  confirmLabel: string
  cancelLabel?: string
  pending?: boolean
  icon?: LucideIcon
  className?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}
