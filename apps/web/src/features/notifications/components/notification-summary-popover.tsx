import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BellOff, CheckCheck, LoaderCircle } from 'lucide-react'
import {
  useNotificationMutations,
  useNotifications,
} from '../hooks/use-notifications'
import {
  formatRelativeNotificationDate,
  getNotificationCategory,
  type NotificationCategoryKey,
} from '../utils/notification-formatters'

interface NotificationSummaryPopoverProps {
  count: number
  path: string
}

const CATEGORY_TABS: Array<{
  id: NotificationCategoryKey
  label: string
}> = [
  { id: 'all', label: 'Todas' },
  { id: 'taller', label: 'Taller' },
  { id: 'citas', label: 'Citas' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'caja', label: 'Caja' },
]

export function NotificationSummaryPopover({
  count,
  path,
}: NotificationSummaryPopoverProps) {
  const [open, setOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<NotificationCategoryKey>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  const summary = useNotifications(
    {
      read: 'all',
      category: selectedTab === 'all' ? undefined : selectedTab,
      page: 1,
      pageSize: 40,
    },
    open || count > 0,
  )
  const mutations = useNotificationMutations()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleNotificationClick = (id: string, isRead: boolean) => {
    setOpen(false)
    if (!isRead) {
      void mutations.markAsRead.mutateAsync(id)
    }
  }

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mutations.markAllAsRead.isPending) return
    try {
      await mutations.markAllAsRead.mutateAsync()
    } catch {
      // Ignored
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Notificaciones${count > 0 ? ` (${count} sin leer)` : ''}`}
        aria-haspopup="dialog"
        className={`relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary ${
          open ? 'bg-muted text-foreground' : ''
        }`}
      >
        <Bell aria-hidden size={18} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4.5 h-4.5 items-center justify-center rounded-full border-2 border-background bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Resumen de notificaciones"
          className="absolute right-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-[0_20px_50px_rgb(16_44_37_/_18%)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-foreground">
                Notificaciones
              </strong>
              {count > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={
                count === 0 || Boolean(mutations.markAllAsRead?.isPending)
              }
              onClick={handleMarkAllAsRead}
              className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
            >
              Marcar todas como leídas
            </button>
          </header>

          {/* Categorías / Tabs */}
          <div
            role="tablist"
            className="flex items-center gap-1 overflow-x-auto border-b bg-muted/20 px-3 pt-2 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORY_TABS.map((tab) => {
              const active = selectedTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`relative shrink-0 px-2.5 pb-2 text-xs font-medium transition-colors ${
                    active
                      ? 'border-b-2 border-primary font-bold text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'all' && count > 0 && (
                    <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Scrollable list without visible scrollbar */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {summary.isPending ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-xs text-muted-foreground">
                <LoaderCircle
                  aria-hidden
                  className="size-4 animate-spin text-primary"
                />
                Cargando notificaciones…
              </div>
            ) : summary.isError ? (
              <p className="px-5 py-8 text-center text-xs text-muted-foreground">
                No se pudo cargar el resumen.
              </p>
            ) : summary.data?.data.length ? (
              summary.data.data.map((notification) => {
                const category = getNotificationCategory(notification.type)
                const Icon = category.icon

                return (
                  <Link
                    key={notification.id}
                    to={notification.link ?? path}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.read,
                      )
                    }
                    className={`block px-4 py-3 transition-colors hover:bg-muted/60 ${
                      notification.read ? 'opacity-70' : 'bg-primary/[0.03]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar / Icon circle */}
                      <div
                        className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ${category.bgIconClass}`}
                      >
                        <Icon size={14} />
                        {!notification.read && (
                          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background bg-emerald-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <strong
                            className={`text-xs ${
                              notification.read
                                ? 'font-medium text-foreground/80'
                                : 'font-semibold text-foreground'
                            }`}
                          >
                            {notification.title}
                          </strong>
                          {!notification.read && (
                            <span
                              aria-label="No leída"
                              className="mt-1 size-2 shrink-0 rounded-full bg-emerald-500"
                            />
                          )}
                        </div>

                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                          {notification.message}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span>
                            {formatRelativeNotificationDate(
                              notification.createdAt,
                            )}
                          </span>
                          <span>•</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${category.badgeClass}`}
                          >
                            {category.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                <BellOff
                  aria-hidden
                  className="size-5 text-muted-foreground/50"
                />
                <p className="text-xs font-semibold text-muted-foreground">
                  No hay notificaciones
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Las alertas y novedades operativas aparecerán aquí.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5">
            <button
              type="button"
              disabled={
                count === 0 || Boolean(mutations.markAllAsRead?.isPending)
              }
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              <CheckCheck size={13} />
              Marcar todas
            </button>
            <Link
              to={path}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver todas
            </Link>
          </footer>
        </section>
      )}
    </div>
  )
}
