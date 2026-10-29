import { Bell, BellOff, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useId } from 'react'
import { useNotifications } from '../hooks/use-notifications'
import { formatNotificationDate } from '../utils/notification-formatters'

interface NotificationSummaryPopoverProps {
  count: number
  path: string
}

export function NotificationSummaryPopover({
  count,
  path,
}: NotificationSummaryPopoverProps) {
  const id = useId()
  const summary = useNotifications({ read: 'all', page: 1, pageSize: 5 }, true)

  const close = () => document.getElementById(id)?.hidePopover()

  return (
    <div className="relative">
      <button
        type="button"
        popoverTarget={id}
        aria-label={`Notificaciones${count > 0 ? ` (${count} sin leer)` : ''}`}
        aria-haspopup="dialog"
        className="relative flex size-10 items-center justify-center rounded-[10px] text-muted-foreground transition-[color,background-color,transform] duration-150 hover:-translate-y-px hover:bg-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Bell aria-hidden size={18} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full border-2 border-card bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <section
        id={id}
        popover="auto"
        aria-label="Resumen de notificaciones"
        className="fixed top-[76px] right-4 left-auto m-0 w-[min(26.875rem,calc(100vw-2rem))] overflow-hidden rounded-[18px] border border-border bg-card text-foreground shadow-[0_18px_40px_rgb(16_44_37_/_16%)] lg:right-[26px]"
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 pt-5 pb-4">
          <div className="grid gap-1">
            <strong className="font-heading text-lg font-semibold">
              Notificaciones
            </strong>
            <span className="text-xs text-muted-foreground">
              {count > 0
                ? `${count} sin leer${count === 1 ? '' : 's'}`
                : 'Estás al día'}
            </span>
          </div>
          <Link
            to={path}
            onClick={close}
            className="pt-1 text-xs font-semibold text-primary hover:underline"
          >
            Ver todas
          </Link>
        </header>

        <div className="max-h-[min(31.25rem,calc(100vh-9.5rem))] overflow-y-auto">
          {summary.isPending ? (
            <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-muted-foreground">
              <LoaderCircle aria-hidden className="size-4 animate-spin" />
              Cargando notificaciones…
            </div>
          ) : summary.isError ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No se pudo cargar el resumen. Abre el módulo para reintentar.
            </p>
          ) : summary.data?.data.length ? (
            summary.data.data.map((notification) => (
              <Link
                key={notification.id}
                to={notification.link ?? path}
                onClick={close}
                className="block border-b px-5 py-4 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-start gap-2">
                  {!notification.read && (
                    <span
                      aria-label="No leída"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <strong className="truncate text-sm font-semibold">
                        {notification.title}
                      </strong>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
              <BellOff aria-hidden className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No hay notificaciones</p>
              <p className="text-xs text-muted-foreground">
                Las novedades de tu operación aparecerán aquí.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
