import type { ComponentType } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from './button'
import type { FeedbackAction } from '@/lib/feedback/feedback.types'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  action?: FeedbackAction
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: IconOverride,
  action,
  className,
}: EmptyStateProps) {
  const Icon = IconOverride ?? Inbox

  return (
    <div
      className={cn(
        'flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-primary">
        <Icon aria-hidden className="size-6" />
      </span>

      <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => action.onClick()}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
