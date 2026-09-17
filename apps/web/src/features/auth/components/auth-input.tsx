import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AuthInputProps extends ComponentProps<typeof Input> {
  id: string
  label: string
  error?: string
  icon?: LucideIcon
  endAdornment?: ReactNode
}

export function AuthInput({
  id,
  label,
  error,
  icon: Icon,
  endAdornment,
  className,
  'aria-describedby': describedBy,
  ...props
}: AuthInputProps) {
  const errorId = `${id}-error`
  const descriptionIds =
    [describedBy, error ? errorId : undefined].filter(Boolean).join(' ') ||
    undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.5}
          />
        )}
        <Input
          {...props}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds}
          className={cn(
            'h-12 rounded-xl text-base sm:text-sm 2xl:h-13 bg-card transition-colors placeholder:text-muted-foreground/65 hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/15 aria-invalid:border-red-600 aria-invalid:focus-visible:ring-red-600/15',
            Icon && 'pl-11',
            endAdornment && 'pr-14',
            className,
          )}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-xs leading-5 text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  )
}
