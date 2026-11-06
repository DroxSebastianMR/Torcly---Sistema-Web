import { Menu, LogOut } from 'lucide-react'
import { paths } from '@/app/router/constants/paths'
import { NotificationSummaryPopover } from '@/features/notifications/components/notification-summary-popover'
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
      {/* Lado izquierdo: Nombre de la organización (verde) y Rol (gris, -2pt) */}
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
              className="truncate font-brand text-[17px] font-bold tracking-tight text-primary sm:text-[19px]"
              title={header.organization.name}
            >
              {header.organization.name}
            </span>
            {header.userRole ? (
              <span
                className="truncate text-[11px] font-normal text-muted-foreground"
                title={header.userRole}
              >
                {header.userRole}
              </span>
            ) : null}
          </div>
        ) : header.isPlatformAdmin ? (
          <div className="flex min-w-0 flex-col justify-center leading-tight">
            <span className="truncate font-brand text-[17px] font-bold tracking-tight text-primary sm:text-[19px]">
              Torcly Plataforma
            </span>
            <span className="truncate text-[11px] font-normal text-muted-foreground">
              Administración Global
            </span>
          </div>
        ) : null}
      </div>

      {/* Lado derecho: Nombre (gris, -2pt) y Correo (negro, -2pt) + En línea (puntito verde, texto gris en negrita, -2pt) */}
      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-col items-end justify-center leading-tight text-right">
          {header.userName ? (
            <span
              className="truncate text-[10px] font-normal text-muted-foreground sm:text-[11px]"
              title={header.userName}
            >
              {header.userName}
            </span>
          ) : null}
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span
              className="truncate text-[11px] font-semibold text-foreground sm:text-xs"
              title={header.userEmail}
            >
              {header.userEmail}
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-muted-foreground sm:text-[10px]"
              title="Usuario activo en línea"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>En línea</span>
            </span>
          </div>
        </div>

        {!header.isPlatformAdmin && (
          <>
            <div className="h-7 w-px bg-border" aria-hidden="true" />
            <NotificationSummaryPopover
              count={header.unreadCount}
              path={paths.notifications}
            />
          </>
        )}

        <div className="h-7 w-px bg-border" aria-hidden="true" />

        <Button
          type="button"
          variant="dangerOutline"
          size="sm"
          disabled={header.isSigningOut}
          onClick={() => void header.onLogout()}
          className="shrink-0"
          aria-label={header.isSigningOut ? 'Cerrando sesión' : 'Cerrar sesión'}
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
