import { cn } from '@/lib/utils'

interface TorclyLogoProps {
  variant?: 'default' | 'inverse'
  className?: string
}

export function TorclyLogo({
  variant = 'default',
  className,
}: TorclyLogoProps) {
  return (
    <span
      role="img"
      aria-label="Torcly"
      className={cn(
        'inline-flex items-baseline text-4xl leading-none font-bold tracking-[-0.06em]',
        variant === 'inverse' ? 'text-white' : 'text-brand-forest',
        className,
      )}
    >
      <span aria-hidden="true">
        torcly<span className="text-brand-accent">.</span>
      </span>
    </span>
  )
}
