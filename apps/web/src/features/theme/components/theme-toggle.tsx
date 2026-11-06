import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/use-theme'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'

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
