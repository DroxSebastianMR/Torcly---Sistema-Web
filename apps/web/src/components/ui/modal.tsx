import {
  useEffect,
  useId,
  useRef,
  type PropsWithChildren,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps extends PropsWithChildren {
  open: boolean
  title: string
  description?: string
  visual?: ReactNode
  footer?: ReactNode
  className?: string
  busy?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  closeButtonLabel?: string
  onClose: () => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
}

export function Modal({
  open,
  title,
  description,
  visual,
  footer,
  className,
  busy = false,
  initialFocusRef,
  closeButtonLabel = 'Cerrar',
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
      if (event.key === 'Escape') {
        if (!busy) onClose()
        return
      }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = getFocusable(panel)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? panelRef.current
      target?.focus()
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [onClose, open, busy, initialFocusRef])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#071c16]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (busy) return
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-busy={busy || undefined}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.35rem] border border-border/80 bg-card shadow-[0_24px_80px_rgba(7,28,22,0.24)] outline-none sm:rounded-[1.35rem]',
          className,
        )}
      >
        <header className="relative px-5 pt-5 sm:px-6 sm:pt-6">
          {visual && <div className="flex justify-start pr-12">{visual}</div>}
          <button
            type="button"
            aria-label={closeButtonLabel}
            disabled={busy}
            onClick={onClose}
            className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40 sm:top-6 sm:right-6"
          >
            <X size={18} />
          </button>
          <div className={cn('pr-12', visual && 'mt-5')}>
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-[-0.015em] text-brand-forest"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-5 text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
        </header>
        {children && (
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        )}
        {footer && (
          <footer className="mt-5 bg-muted/55 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
