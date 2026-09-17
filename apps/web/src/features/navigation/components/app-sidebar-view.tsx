import { LogOut, X } from 'lucide-react'
import { TorclyLogo } from '@/components/brand/torcly-logo'
import { SidebarNavigationItem } from './sidebar-navigation-item'
import type { SidebarViewProps } from '../types/navigation.types'

export function AppSidebarView({
  groups,
  account,
  isSigningOut,
  onLogout,
  onNavigate,
}: SidebarViewProps) {
  return (
    <>
      <header className="flex h-20 shrink-0 items-center justify-between px-6 [@media(max-height:700px)]:h-16">
        <TorclyLogo variant="inverse" className="text-3xl" />
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Cerrar menú"
          className="flex size-10 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-accent lg:hidden"
        >
          <X aria-hidden="true" size={18} />
        </button>
      </header>
      <nav
        aria-label="Módulos"
        className="sidebar-navigation min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 pb-3 [@media(max-height:700px)]:space-y-2"
      >
        {groups.map((group) => (
          <section key={group.id} aria-label={group.label}>
            <h2 className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45 [@media(max-height:700px)]:mb-1">
              {group.label}
            </h2>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavigationItem
                  key={item.id}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <footer className="mx-3 shrink-0 border-t border-white/10 py-3 [@media(max-height:700px)]:py-2">
        <div className="flex items-center gap-3 px-2">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-semibold text-brand-accent"
          >
            {account.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium" title={account.name}>
              {account.name}
            </p>
            <p
              className="mt-1 truncate text-[10px] text-white/50"
              title={account.email}
            >
              {account.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            aria-label={isSigningOut ? 'Cerrando sesión' : 'Cerrar sesión'}
            title="Cerrar sesión"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-accent disabled:opacity-50"
          >
            <LogOut aria-hidden="true" size={16} />
          </button>
        </div>
      </footer>
    </>
  )
}
