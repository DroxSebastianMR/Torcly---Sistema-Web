import { useId, type ComponentType } from 'react'
import { LoaderCircle } from 'lucide-react'
import { Button } from './button'
import { getFeedbackPreset } from '@/lib/feedback/feedback.presets'
import type {
  FeedbackAction,
  FeedbackKind,
} from '@/lib/feedback/feedback.types'
import { cn } from '@/lib/utils'

interface SystemFeedbackScreenProps {
  kind?: FeedbackKind
  title?: string
  description?: string
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  primaryAction?: FeedbackAction
  secondaryAction?: FeedbackAction
  busy?: boolean
  className?: string
}

export function SystemFeedbackScreen({
  kind = 'unexpected',
  title,
  description,
  icon: IconOverride,
  primaryAction,
  secondaryAction,
  busy = false,
  className,
}: SystemFeedbackScreenProps) {
  const titleId = useId()
  const preset = getFeedbackPreset(kind)
  const Icon = IconOverride ?? preset.icon

  return (
    <main
      aria-labelledby={titleId}
      className={cn(
        'relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-6 py-12 text-center',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-24 size-80 rounded-full bg-primary/8 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 -bottom-32 size-96 rounded-full bg-brand-accent/10 blur-3xl"
      />

      <section
        role="alert"
        aria-busy={busy || undefined}
        className="relative flex w-full max-w-md flex-col items-center"
      >
        <span className="flex size-20 items-center justify-center rounded-full bg-muted/70 ring-1 ring-primary/15 sm:size-24">
          <Icon aria-hidden className="size-9 text-primary sm:size-11" />
        </span>

        <h1
          id={titleId}
          className="mt-6 text-[clamp(1.5rem,3vw,1.9rem)] font-semibold tracking-[-0.035em] text-brand-forest"
        >
          {title ?? preset.title}
        </h1>

        <p className="mt-3 max-w-sm text-[0.95rem] leading-6 text-muted-foreground">
          {description ?? preset.description}
        </p>

        {(primaryAction || secondaryAction) && (
          <div className="mt-8 flex w-full max-w-xs flex-col-reverse items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {secondaryAction && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => secondaryAction.onClick()}
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                type="button"
                disabled={busy}
                className="w-full sm:w-auto"
                onClick={() => primaryAction.onClick()}
              >
                {busy && (
                  <LoaderCircle
                    aria-hidden
                    className="size-4 motion-safe:animate-spin"
                  />
                )}
                {primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
