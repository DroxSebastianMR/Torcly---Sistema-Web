import { X } from 'lucide-react'
import { TorclyLogo } from '@/components/brand/torcly-logo'
import { SidebarNavigationItem } from './sidebar-navigation-item'
import type { SidebarViewProps } from '../types/navigation.types'

export function AppSidebarView({ groups, onNavigate }: SidebarViewProps) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between px-6">
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
        className="sidebar-navigation min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 pb-3"
      >
        {groups.map((group) => (
          <section key={group.id} aria-label={group.label}>
            <h2 className="mb-1 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {group.label}
            </h2>
            <ul>
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
      <footer className="shrink-0 px-6 py-2 text-[10px] font-medium tracking-[0.12em] text-white/35">
        v3.3.2
      </footer>
    </>
  )
}
