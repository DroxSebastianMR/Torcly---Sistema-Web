import type { ComponentType } from 'react'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { Button } from './button'
import type { FeedbackAction } from '@/lib/feedback/feedback.types'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  action?: FeedbackAction
  busy?: boolean
  className?: string
}

export function ErrorState({
  title,
  description,
  icon: IconOverride,
  action,
  busy = false,
  className,
}: ErrorStateProps) {
  const Icon = IconOverride ?? TriangleAlert

  return (
    <div
      role="alert"
      aria-busy={busy || undefined}
      className={cn(
        'flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-primary">
        <Icon aria-hidden className="size-6" />
      </span>

      <p className="mt-4 font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          className="mt-5"
          onClick={() => action.onClick()}
        >
          {busy && (
            <LoaderCircle
              aria-hidden
              className="size-4 motion-safe:animate-spin"
            />
          )}
          {action.label}
        </Button>
      )}
    </div>
  )
}
