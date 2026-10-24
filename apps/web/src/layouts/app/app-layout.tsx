import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { AppHeader } from '@/features/navigation/components/app-header'
import { AppSidebar } from './components/app-sidebar'
import { MaintenanceBanner } from '@/features/maintenance/components/maintenance-banner'
import { reportModuleLoad } from '@/features/navigation/utils/module-load-metrics'
import { toast } from '@/components/ui/toast-manager'
import { useAuth } from '@/features/auth/hooks/auth-context'

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()
  const navigation = useNavigation()
  const startedAt = useRef<number | null>(null)
  const previousState = useRef(navigation.state)
  const reportedInitial = useRef(false)

  useEffect(() => {
    if (!user || sessionStorage.getItem(`torcly:welcome:${user.id}`)) return
    sessionStorage.setItem(`torcly:welcome:${user.id}`, 'shown')
    toast.add({
      type: 'success',
      title: `Bienvenido, ${user.name}`,
      description: 'Tu espacio de trabajo está listo.',
      timeout: 4_000,
    })
  }, [user])

  useEffect(() => {
    const startedAtMs = startedAt.current ?? performance.now()
    startedAt.current = startedAtMs

    if (!reportedInitial.current) {
      reportedInitial.current = true
      const initial = performance.getEntriesByType('navigation')[0]
      reportModuleLoad(
        location.pathname,
        initial?.duration ?? performance.now() - startedAtMs,
        'initial',
      )
    }

    if (navigation.state !== 'idle') {
      startedAt.current = performance.now()
    } else if (previousState.current !== 'idle') {
      const routeStartMs = startedAt.current ?? 0
      reportModuleLoad(
        location.pathname,
        performance.now() - routeStartMs,
        'route-change',
      )
    }
    previousState.current = navigation.state
  }, [location.pathname, navigation.state])
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
        <MaintenanceBanner />
        <main id="content" className="mx-auto max-w-7xl p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
