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
    <header className="sticky top-0 z-10 flex min-h-[68px] items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur-[14px] sm:gap-4 lg:px-[26px]">
      {/* Lado izquierdo: Nombre de la organización (verde) y Rol (gris) */}
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
          <div className="flex min-w-0 flex-col justify-center leading-snug">
            <span
              className="truncate font-brand text-base font-bold tracking-tight text-primary sm:text-lg"
              title={header.organization.name}
            >
              {header.organization.name}
            </span>
            {header.userRole ? (
              <span
                className="truncate text-xs font-normal text-muted-foreground"
                title={header.userRole}
              >
                {header.userRole}
              </span>
            ) : null}
          </div>
        ) : header.isPlatformAdmin ? (
          <div className="flex min-w-0 flex-col justify-center leading-snug">
            <span className="truncate font-brand text-base font-bold tracking-tight text-primary sm:text-lg">
              Torcly Plataforma
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              Administración Global
            </span>
          </div>
        ) : null}
      </div>

      {/* Lado derecho: Nombre de usuario (gris) y Correo (verde) + En línea (gris) */}
      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-col items-end justify-center leading-snug text-right">
          {header.userName ? (
            <span
              className="truncate text-xs font-normal text-muted-foreground sm:text-[13px]"
              title={header.userName}
            >
              {header.userName}
            </span>
          ) : null}
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span
              className="truncate text-xs font-semibold text-primary sm:text-[13px]"
              title={header.userEmail}
            >
              {header.userEmail}
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-normal text-muted-foreground"
              title="Usuario activo en línea"
            >
              <span className="size-1.5 rounded-full bg-muted-foreground/70" />
              <span>En línea</span>
            </span>
          </div>
        </div>

        <div className="h-7 w-px bg-border" aria-hidden="true" />

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
          <LogOut aria-hidden="true" size={16} />
          <span className="hidden md:inline">
            {header.isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </span>
        </Button>
      </div>
    </header>
  )
}
