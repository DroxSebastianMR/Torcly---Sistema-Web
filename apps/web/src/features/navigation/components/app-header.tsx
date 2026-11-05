import { Menu, LogOut } from 'lucide-react'
import { useAppHeader } from '../hooks/use-app-header'
import { Button } from '@/components/ui/button'

interface AppHeaderProps {
  sidebarOpen: boolean
  onOpenSidebar: () => void
}

export function AppHeader({ sidebarOpen, onOpenSidebar }: AppHeaderProps) {
  const header = useAppHeader()

  return (
    <header className="sticky top-0 z-10 flex min-h-[72px] items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur-[14px] sm:gap-4 lg:px-[26px]">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          aria-controls="app-sidebar"
          aria-expanded={sidebarOpen}
          onClick={onOpenSidebar}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary lg:hidden"
        >
          <Menu size={20} />
        </button>

        {header.organization ? (
          <div className="flex min-w-0 flex-col justify-center leading-tight">
            <span
              className="truncate font-brand text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              title={header.organization.name}
            >
              {header.organization.name}
            </span>
            {header.userName && (
              <span
                className="truncate text-xs font-normal text-muted-foreground sm:text-[13px]"
                title={header.userName}
              >
                {header.userName}
              </span>
            )}
          </div>
        ) : header.isPlatformAdmin ? (
          <div className="flex min-w-0 flex-col justify-center leading-tight">
            <span className="truncate font-brand text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Torcly Plataforma
            </span>
            {header.userName && (
              <span
                className="truncate text-xs font-normal text-muted-foreground sm:text-[13px]"
                title={header.userName}
              >
                {header.userName}
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-col items-end justify-center gap-0.5 text-right">
          {header.userRole ? (
            <span className="truncate text-[11px] font-normal text-muted-foreground sm:text-xs">
              {header.userRole}
            </span>
          ) : null}
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span
              className="truncate text-xs font-semibold text-foreground sm:text-sm"
              title={header.userEmail}
            >
              {header.userEmail}
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
              title="Usuario activo en línea"
            >
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>En línea</span>
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-border" aria-hidden="true" />

        <Button
          type="button"
          variant="dangerOutline"
          size="sm"
          disabled={header.isSigningOut}
          onClick={() => void header.onLogout()}
          className="shrink-0"
          aria-label={
            header.isSigningOut ? 'Cerrando sesión' : 'Cerrar sesión'
          }
        >
          <LogOut aria-hidden="true" size={17} />
          <span className="hidden md:inline">
            {header.isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </span>
        </Button>
      </div>
    </header>
  )
}
