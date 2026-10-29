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
    <header className="sticky top-0 z-10 flex min-h-[72px] items-center gap-2 border-b bg-card/95 px-4 backdrop-blur-[14px] sm:gap-4 lg:px-[26px]">
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
      <div className="ml-auto flex shrink-0 items-center gap-3.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="grid min-w-0 max-w-36 gap-0.5 border-r pr-3.5 text-right sm:max-w-[230px]">
            <p
              className="truncate text-[10px] text-muted-foreground"
              title={header.account.email}
            >
              {header.account.email}
            </p>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <strong
                className="truncate text-[11px] font-semibold text-foreground"
                title={header.account.name}
              >
                {header.account.name}
              </strong>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                <i aria-hidden className="size-2 rounded-full bg-emerald-500" />
                En línea
              </span>
            </div>
          </div>
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
            <span>
              {header.isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </span>
          </Button>
        </div>
      </div>
    </header>
  )
}
