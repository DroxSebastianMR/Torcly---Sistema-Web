import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AppHeader } from '@/features/navigation/components/app-header'
import { AppSidebar } from './components/app-sidebar'

export function AppLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen">
      <a href="#content" className="sr-only focus:not-sr-only">
        Saltar al contenido
      </a>
      {open && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="app-sidebar"
        aria-label="Navegación principal"
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-white/5 bg-brand-forest text-white lg:flex',
          open ? 'flex' : 'hidden',
        )}
      >
        <AppSidebar onNavigate={() => setOpen(false)} />
      </aside>
      <div className="lg:pl-64">
        <AppHeader sidebarOpen={open} onOpenSidebar={() => setOpen(true)} />
        <main id="content" className="mx-auto max-w-7xl p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
