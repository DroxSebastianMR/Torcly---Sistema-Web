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

let bodyScrollLockCount = 0
let previousBodyOverflow = ''

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bodyScrollLockCount += 1
}

function unlockBodyScroll() {
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
  }
}

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
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)

  // Mantiene el listener estable mientras el diálogo está abierto. Varios
  // formularios recrean sus callbacks al escribir; reiniciar el efecto de foco
  // en cada pulsación devolvía el foco al panel y expulsaba al usuario del input.
  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
  }, [busy, onClose])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    lockBodyScroll()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!busyRef.current) onCloseRef.current()
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
    const focusFrame = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (panel?.contains(document.activeElement)) return
      const target = initialFocusRef?.current ?? panelRef.current
      target?.focus()
    })

    return () => {
      cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      unlockBodyScroll()
      previousFocus?.focus()
    }
  }, [open, initialFocusRef])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#071c16]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
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
          'flex max-h-[calc(100dvh-3rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[18px] border border-border bg-card shadow-[0_24px_60px_rgb(16_44_37_/_18%)] outline-none sm:rounded-[18px]',
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
            className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-[10px] text-muted-foreground transition-[color,background-color,transform] duration-150 hover:-translate-y-px hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40 sm:top-6 sm:right-6"
          >
            <X size={18} />
          </button>
          <div className={cn('pr-12', visual && 'mt-5')}>
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-[-0.015em] text-brand-forest"
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
          <div className="overflow-y-auto px-5 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
            {children}
          </div>
        )}
        {footer && (
          <footer className="mt-5 border-t bg-background px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}
