import {
  useEffect,
  useId,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps extends PropsWithChildren {
  open: boolean
  title: string
  description?: string
  footer?: ReactNode
  className?: string
  onClose: () => void
}

export function Modal({
  open,
  title,
  description,
  footer,
  className,
  onClose,
  children,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose, open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#071c16]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border bg-card shadow-2xl outline-none sm:rounded-2xl',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-brand-forest"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-1 text-sm leading-5 text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="border-t px-5 py-4 sm:px-6">{footer}</footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
