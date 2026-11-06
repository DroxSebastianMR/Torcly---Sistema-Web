import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '../hooks/use-theme'

interface ThemeToggleProps {
  variant?: 'icon' | 'sidebar'
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggleTheme}
        className="group flex min-h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] text-white/65 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-accent"
      >
        {isDark ? (
          <Moon
            aria-hidden
            size={17}
            strokeWidth={1.6}
            className="text-brand-accent"
          />
        ) : (
          <Sun
            aria-hidden
            size={17}
            strokeWidth={1.6}
            className="text-white/45 group-hover:text-white/80"
          />
        )}
        <span>Modo oscuro</span>
        <span
          aria-hidden
          className={cn(
            'ml-auto flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
            isDark ? 'bg-brand-accent' : 'bg-white/15',
          )}
        >
          <span
            className={cn(
              'size-4 rounded-full bg-white shadow-sm transition-transform',
              isDark && 'translate-x-4',
            )}
          />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className="grid size-10 place-items-center rounded-xl border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {isDark ? (
        <Sun aria-hidden className="size-[18px]" />
      ) : (
        <Moon aria-hidden className="size-[18px]" />
      )}
    </button>
  )
}
