import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TableActionTone = 'default' | 'warning' | 'danger'

interface TableActionButtonProps
  extends Omit<ComponentProps<'button'>, 'children' | 'title'> {
  label: string
  title?: string
  tone?: TableActionTone
  children: ReactNode
}

const toneStyles: Record<TableActionTone, string> = {
  default:
    'bg-primary/8 text-primary shadow-sm hover:bg-primary/15 hover:text-primary',
  warning:
    'bg-amber-100 text-amber-800 shadow-sm hover:bg-amber-200 hover:text-amber-900',
  danger:
    'bg-rose-100 text-rose-700 shadow-sm hover:bg-rose-200 hover:text-rose-800',
}

/** Acción compacta y accesible para filas de tablas. */
export function TableActionButton({
  label,
  title,
  tone = 'default',
  className,
  type = 'button',
  children,
  ...props
}: TableActionButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-xl p-0 transition-[background-color,color,box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-0 disabled:pointer-events-none disabled:opacity-40',
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
