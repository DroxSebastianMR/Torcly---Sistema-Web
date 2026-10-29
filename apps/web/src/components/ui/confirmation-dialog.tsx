import { useRef, useState } from 'react'
import {
  Check,
  CircleCheck,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Button } from './button'
import { Modal } from './modal'
import { cn } from '@/lib/utils'
import type {
  ConfirmationDialogProps,
  ConfirmationVariant,
} from './confirmation-dialog.types'

const variantStyles: Record<
  ConfirmationVariant,
  { icon: typeof Info; iconClassName: string; confirmClassName: string }
> = {
  danger: {
    icon: TriangleAlert,
    iconClassName: 'bg-amber-100 text-amber-700 ring-8 ring-amber-50/80',
    confirmClassName: 'bg-amber-600 text-white hover:bg-amber-700',
  },
  success: {
    icon: CircleCheck,
    iconClassName: 'bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50/80',
    confirmClassName: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  info: {
    icon: Info,
    iconClassName: 'bg-primary/10 text-primary ring-8 ring-primary/5',
    confirmClassName: '',
  },
}

export function ConfirmationDialog({
  open,
  title,
  description,
  variant = 'info',
  confirmLabel,
  cancelLabel = 'Cancelar',
  pending,
  icon: IconOverride,
  className,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [autoPending, setAutoPending] = useState(false)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const style = variantStyles[variant]
  const Icon = IconOverride ?? style.icon
  const isPending = pending ?? autoPending

  const handleConfirm = async () => {
    if (isPending) return
    setAutoPending(true)
    try {
      await onConfirm()
      onCancel()
    } catch {
      // La acción informó el error; el diálogo permanece abierto.
    } finally {
      setAutoPending(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      visual={
        <span
          className={cn(
            'flex size-12 items-center justify-center rounded-full shadow-[0_8px_18px_rgba(16,44,37,0.08)] sm:size-14',
            style.iconClassName,
          )}
        >
          <Icon aria-hidden className="size-6 sm:size-7" />
        </span>
      }
      className={cn('max-w-md', className)}
      busy={isPending}
      initialFocusRef={primaryRef}
      onClose={onCancel}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onCancel}
            className="w-full bg-background shadow-sm"
          >
            <X aria-hidden className="size-4" />
            {cancelLabel}
          </Button>
          <Button
            ref={primaryRef}
            type="button"
            disabled={isPending}
            className={cn('w-full shadow-sm', style.confirmClassName)}
            onClick={() => void handleConfirm()}
          >
            {isPending && (
              <LoaderCircle
                aria-hidden
                className="size-4 motion-safe:animate-spin"
              />
            )}
            {!isPending && <Check aria-hidden className="size-4" />}
            {confirmLabel}
          </Button>
        </div>
      }
    />
  )
}
