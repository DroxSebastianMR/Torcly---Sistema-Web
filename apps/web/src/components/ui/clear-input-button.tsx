import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClearInputButtonProps {
  onClear: () => void
  className?: string
  label?: string
}

/** Acción compacta para vaciar búsquedas sin perder el foco del campo. */
export function ClearInputButton({
  onClear,
  className,
  label = 'Limpiar búsqueda',
}: ClearInputButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        className,
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClear}
    >
      <X aria-hidden className="size-4" />
    </button>
  )
}
