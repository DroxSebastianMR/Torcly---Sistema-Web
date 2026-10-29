import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends ComponentProps<'input'> {
  invalid?: boolean
  leadingIcon?: ReactNode
  trailingAction?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, leadingIcon, trailingAction, ...props },
  ref,
) {
  return (
    <span
      className={cn(
        'flex min-h-11 w-full items-center rounded-[10px] border border-input bg-card text-sm transition-[border-color,background-color] duration-150 ease-out hover:bg-background focus-within:border-primary/70 focus-within:outline-none',
        invalid && 'border-red-500 focus-within:border-red-600',
        className,
      )}
    >
      {leadingIcon && (
        <span className="grid shrink-0 place-items-center pl-3 text-muted-foreground">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className="h-[42px] min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {trailingAction && (
        <span className="mr-1 shrink-0">{trailingAction}</span>
      )}
    </span>
  )
})
