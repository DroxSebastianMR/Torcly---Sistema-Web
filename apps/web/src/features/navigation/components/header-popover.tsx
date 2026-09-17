import { useId, type ReactNode } from 'react'

interface HeaderPopoverProps {
  label: string
  trigger: ReactNode
  children: (close: () => void) => ReactNode
}
export function HeaderPopover({
  label,
  trigger,
  children,
}: HeaderPopoverProps) {
  const id = useId()
  return (
    <div className="relative">
      <button
        type="button"
        popoverTarget={id}
        aria-label={label}
        className="flex h-10 items-center gap-2 rounded-xl px-2 text-sm text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
      >
        {trigger}
      </button>
      <div
        id={id}
        popover="auto"
        aria-label={label}
        className="fixed top-18 right-4 left-auto m-0 w-64 max-w-[calc(100vw-2rem)] rounded-xl border bg-card p-2 text-foreground shadow-xl lg:right-8"
      >
        {children(() => document.getElementById(id)?.hidePopover())}
      </div>
    </div>
  )
}
