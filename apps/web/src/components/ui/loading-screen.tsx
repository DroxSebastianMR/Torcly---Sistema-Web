import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingScreen({
  title = 'Preparando tu espacio',
  description = 'Estamos cargando la información necesaria.',
  className,
}: LoadingScreenProps) {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
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

      <section className="relative flex w-full max-w-sm flex-col items-center">
        <div className="relative flex size-52 items-center justify-center sm:size-60">
          <span
            aria-hidden="true"
            className="absolute inset-2 rounded-[42%_58%_54%_46%/49%_42%_58%_51%] border border-primary/15 motion-safe:animate-[torcly-loader-breathe_2.8s_ease-in-out_infinite]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-8 rounded-full border-[3px] border-primary/15"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-8 size-auto motion-safe:animate-[torcly-loader-spin_2.4s_linear_infinite]"
          >
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="46 250"
              className="text-[#043129]"
            />
          </svg>
          <img
            src="/torcly-icon.png"
            alt=""
            className="size-12 rounded-[1.1rem] shadow-[0_8px_22px_rgba(4,49,41,0.26)] motion-safe:animate-[torcly-loader-breathe_2.8s_ease-in-out_infinite] sm:size-14"
          />
        </div>

        <h1 className="mt-8 text-[clamp(1.65rem,3vw,2rem)] font-semibold tracking-[-0.035em] text-brand-forest">
          {title}
        </h1>
        <p className="mt-3 max-w-xs text-[0.95rem] leading-6 text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  )
}
