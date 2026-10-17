import { useState } from 'react'
import { CalendarClock, Plus, Wrench, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { LoadingScreen } from '@/components/ui/loading-screen'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import {
  useMaintenanceMutations,
  useMaintenanceWindows,
} from '../hooks/use-maintenance'
import type { MaintenanceWindowAdmin } from '../types/maintenance.types'
import {
  formatWindowRange,
  getMaintenanceErrorMessage,
} from '../utils/maintenance-formatters'

export default function Page() {
  const { user } = useAuth()
  const windows = useMaintenanceWindows()
  const { schedule, cancel } = useMaintenanceMutations()
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [message, setMessage] = useState('')
  const [pendingCancel, setPendingCancel] =
    useState<MaintenanceWindowAdmin | null>(null)

  const canWrite = hasPermission(user?.permissions ?? [], 'maintenance:write')

  if (windows.isLoading) {
    return (
      <LoadingScreen
        title="Cargando mantenimiento"
        description="Consultando las ventanas programadas."
      />
    )
  }

  const handleSubmit = async () => {
    if (!startsAt || !endsAt) {
      toast.error('Selecciona el inicio y el fin de la ventana.')
      return
    }
    if (message.trim().length < 5) {
      toast.error('Describe la ventana con al menos 5 caracteres.')
      return
    }

    try {
      await schedule.mutateAsync({
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        message: message.trim(),
      })
      toast.success('Ventana de mantenimiento programada.')
      setStartsAt('')
      setEndsAt('')
      setMessage('')
    } catch (error) {
      toast.error(getMaintenanceErrorMessage(error))
    }
  }

  const handleCancel = async () => {
    if (!pendingCancel) return
    try {
      await cancel.mutateAsync(pendingCancel.id)
      toast.success('Ventana de mantenimiento cancelada.')
      setPendingCancel(null)
    } catch (error) {
      toast.error(getMaintenanceErrorMessage(error))
      throw error
    }
  }

  const items = windows.data ?? []

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <Wrench size={15} /> Continuidad operativa
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
          Mantenimiento planificado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Programa y comunica ventanas de mantenimiento. Los usuarios ven un
          aviso mientras la ventana está en curso.
        </p>
      </header>

      {canWrite ? (
        <section
          aria-label="Programar ventana"
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Plus aria-hidden className="size-4" /> Nueva ventana
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Inicio</span>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Fin</span>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-medium text-foreground">
                Mensaje para los usuarios
              </span>
              <Input
                type="text"
                value={message}
                maxLength={300}
                placeholder="Ej. Actualizamos el sistema; algunas acciones estarán pausadas."
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              disabled={schedule.isPending}
              onClick={() => void handleSubmit()}
            >
              <CalendarClock aria-hidden className="size-4" />
              Programar
            </Button>
          </div>
        </section>
      ) : (
        <p
          role="note"
          className="rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
        >
          Tu usuario puede consultar las ventanas, pero no programarlas.
        </p>
      )}

      {windows.isError ? (
        <EmptyState
          title="No se pudo cargar el mantenimiento"
          description="Vuelve a intentarlo en unos momentos."
          action={{
            label: 'Reintentar',
            onClick: () => void windows.refetch(),
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin ventanas programadas"
          description="No hay mantenimientos programados ni en curso."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {item.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatWindowRange(item.startsAt, item.endsAt)}
                </p>
              </div>
              {canWrite && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => setPendingCancel(item)}
                >
                  <X aria-hidden className="size-4" /> Cancelar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmationDialog
        open={pendingCancel !== null}
        variant="danger"
        title="Cancelar ventana de mantenimiento"
        description="La ventana dejará de mostrarse a los usuarios. Esta acción no se puede deshacer."
        confirmLabel="Cancelar ventana"
        pending={cancel.isPending}
        onConfirm={handleCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  )
}
