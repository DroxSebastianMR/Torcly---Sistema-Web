import { Link } from 'react-router-dom'
import {
  Menu,
  ChevronRight,
  ChevronDown,
  Bell,
  Zap,
  LogOut,
  UserRound,
} from 'lucide-react'
import { useAppHeader } from '../hooks/use-app-header'
import { NavigationSearch } from './navigation-search'
import { HeaderPopover } from './header-popover'

interface AppHeaderProps {
  sidebarOpen: boolean
  onOpenSidebar: () => void
}
const menuLink =
  'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary'

export function AppHeader({ sidebarOpen, onOpenSidebar }: AppHeaderProps) {
  const header = useAppHeader()
  return (
    <header className="sticky top-0 z-10 flex min-h-18 items-center gap-2 border-b bg-card/95 px-4 backdrop-blur-sm sm:gap-4 lg:px-8">
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
      <nav aria-label="Ubicación actual" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 text-xs">
          <li className="hidden text-muted-foreground xl:block">
            {header.current?.group ?? 'Torcly'}
          </li>
          <li className="hidden xl:block">
            <ChevronRight
              aria-hidden="true"
              size={13}
              className="text-muted-foreground/50"
            />
          </li>
          <li
            aria-current="page"
            className="truncate text-sm font-medium text-brand-forest"
          >
            {header.current?.label ?? 'Espacio de trabajo'}
          </li>
        </ol>
      </nav>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NavigationSearch items={header.links} />
        {header.quickAccess.length > 0 && (
          <HeaderPopover
            label="Accesos rápidos"
            trigger={
              <>
                <Zap aria-hidden="true" size={17} className="text-primary" />
                <span className="hidden text-xs font-medium xl:inline">
                  Accesos
                </span>
              </>
            }
          >
            {(close) => (
              <>
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Accesos rápidos
                </p>
                {header.quickAccess.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={close}
                    className={menuLink}
                  >
                    <item.icon
                      aria-hidden="true"
                      size={16}
                      className="text-primary"
                    />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </HeaderPopover>
        )}
        {header.notifications && (
          <Link
            to={header.notifications.path}
            aria-label="Notificaciones"
            title="Notificaciones"
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Bell aria-hidden="true" size={18} />
          </Link>
        )}
        <div className="ml-1 border-l pl-1 sm:pl-3">
          <HeaderPopover
            label="Mi cuenta"
            trigger={
              <>
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary"
                >
                  {header.account.initials}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  size={13}
                  className="hidden text-muted-foreground sm:block"
                />
              </>
            }
          >
            {(close) => (
              <>
                <div className="mb-2 border-b px-3 py-3">
                  <p className="truncate text-sm font-semibold">
                    {header.account.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {header.account.email}
                  </p>
                </div>
                {header.profile && (
                  <Link
                    to={header.profile.path}
                    onClick={close}
                    className={menuLink}
                  >
                    <UserRound aria-hidden="true" size={16} />
                    Mi perfil
                  </Link>
                )}
                <button
                  type="button"
                  disabled={header.isSigningOut}
                  onClick={async () => {
                    await header.onLogout()
                    close()
                  }}
                  className={`${menuLink} w-full text-left disabled:opacity-50`}
                >
                  <LogOut aria-hidden="true" size={16} />
                  {header.isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
                </button>
              </>
            )}
          </HeaderPopover>
        </div>
      </div>
    </header>
  )
}
