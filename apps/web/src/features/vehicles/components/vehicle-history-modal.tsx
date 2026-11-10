import {
  Calendar,
  CheckCircle2,
  Clock,
  Gauge,
  Package,
  Printer,
  User,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { Modal } from '@/components/ui/modal'
import { dateFormatter, documentLabel } from '@/features/customers/utils/customer-formatters'
import { useVehicleHistory } from '../hooks/use-vehicles'
import type { Vehicle } from '../types/vehicles.types'
import { vehicleOwnerDisplay } from '../utils/vehicle-formatters'

interface VehicleHistoryModalProps {
  open: boolean
  vehicle: Vehicle | null
  onClose: () => void
}

const statusBadgeStyles: Record<string, string> = {
  RECEPCIONADA: 'bg-stone-100 text-stone-700 border-stone-200',
  EN_DIAGNOSTICO: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDIENTE_APROBACION: 'bg-sky-50 text-sky-700 border-sky-200',
  APROBADA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  EN_PROCESO: 'bg-blue-50 text-blue-700 border-blue-200',
  LISTA_PARA_ENTREGA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ENTREGADA: 'bg-green-100 text-green-800 border-green-300',
  RECHAZADA: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELADA: 'bg-gray-100 text-gray-600 border-gray-200',
}

const statusLabels: Record<string, string> = {
  RECEPCIONADA: 'Recepcionada',
  EN_DIAGNOSTICO: 'En diagnóstico',
  PENDIENTE_APROBACION: 'Pendiente aprobación',
  APROBADA: 'Aprobada',
  EN_PROCESO: 'En proceso',
  LISTA_PARA_ENTREGA: 'Lista para entrega',
  ENTREGADA: 'Entregada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
}

export function VehicleHistoryModal({
  open,
  vehicle,
  onClose,
}: VehicleHistoryModalProps) {
  const historyQuery = useVehicleHistory(open && vehicle ? vehicle.id : null)
  const history = historyQuery.data

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial clínico automotriz"
      description={
        vehicle
          ? `Hoja de vida mecánica de la unidad ${vehicle.plate} (${vehicle.brand} ${vehicle.model} · ${vehicle.year})`
          : 'Consulta el historial de atenciones de la unidad.'
      }
      className="max-w-4xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="gap-1.5"
            disabled={!history || history.timeline.length === 0}
          >
            <Printer size={16} /> Imprimir historial
          </Button>
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {!vehicle ? null : historyQuery.isLoading ? (
        <div className="space-y-4 py-8 text-center text-sm text-muted-foreground animate-pulse">
          <Wrench className="mx-auto size-8 text-primary animate-spin" />
          <p>Cargando hoja de vida y atenciones anteriores…</p>
        </div>
      ) : historyQuery.isError ? (
        <ErrorState
          title="Error al cargar historial clínico"
          description="No se pudo obtener la información histórica de esta unidad vehicular."
          action={{
            label: 'Reintentar',
            onClick: () => historyQuery.refetch(),
          }}
        />
      ) : !history ? null : (
        <div className="space-y-6">
          {/* Ficha Resumen de la Unidad y Propietario */}
          <div className="rounded-2xl border border-[#dce9e2] bg-[#f9fbfa] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-brand-forest px-3 py-1 font-mono text-base font-bold tracking-wider text-white shadow-sm">
                    {vehicle.plate}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {vehicle.brand} {vehicle.model}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Año {vehicle.year}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Propietario:{' '}
                  <span className="font-semibold text-foreground">
                    {vehicleOwnerDisplay(vehicle.owner)}
                  </span>{' '}
                  · {documentLabel(vehicle.owner.type)} {vehicle.owner.documentNumber}
                </p>
              </div>

              {history.summary.lastVisitAt && (
                <div className="text-left sm:text-right text-xs text-muted-foreground">
                  <span>Última visita al taller:</span>
                  <p className="font-semibold text-foreground">
                    {dateFormatter(history.summary.lastVisitAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Tarjetas KPI Superiores */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Calendar className="size-4 text-primary" />
                  <span>Visitas al taller</span>
                </div>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                  {history.summary.totalVisits}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {history.summary.totalVisits === 1 ? 'atención' : 'atenciones'}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Inversión acumulada</span>
                </div>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                  S/ {history.summary.totalSpent.toFixed(2)}
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-background p-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Gauge className="size-4 text-amber-600" />
                  <span>Último kilometraje</span>
                </div>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                  {history.summary.lastMileage !== null
                    ? `${history.summary.lastMileage.toLocaleString('es-PE')} km`
                    : 'Sin registro'}
                </p>
              </div>
            </div>
          </div>

          {/* Línea de Tiempo de Atenciones */}
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#53685f]">
              Línea de tiempo de visitas ({history.timeline.length})
            </h2>

            {history.timeline.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Sin historial de atenciones"
                description="Este vehículo aún no cuenta con órdenes de trabajo registradas en el taller."
              />
            ) : (
              <div className="relative space-y-6 pl-6 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-[#dce9e2]">
                {history.timeline.map((entry) => (
                  <article
                    key={entry.id}
                    className="relative rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition hover:shadow-md"
                  >
                    {/* Bullet marker */}
                    <span className="absolute -left-[30px] top-5 size-4 rounded-full border-2 border-primary bg-background" />

                    {/* Encabezado del Evento */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {entry.code}
                          </span>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                              statusBadgeStyles[entry.status] ??
                              'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {statusLabels[entry.status] ?? entry.status}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {entry.source === 'APPOINTMENT' ? 'Con cita' : 'Directa'}
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={13} /> {dateFormatter(entry.entryDate)}
                          </span>
                          {entry.mileage !== null && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Gauge size={13} className="text-amber-600" />{' '}
                              {entry.mileage.toLocaleString('es-PE')} km
                            </span>
                          )}
                          {entry.technician && (
                            <span className="flex items-center gap-1">
                              <User size={13} /> Mecánico: {entry.technician.fullName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-muted-foreground">Total orden:</span>
                        <p className="text-base font-bold text-brand-forest">
                          S/ {entry.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Diagnóstico / Motivo */}
                    {(entry.diagnosis || entry.receptionNotes) && (
                      <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs text-foreground">
                        {entry.diagnosis && (
                          <p>
                            <span className="font-semibold text-muted-foreground">
                              Diagnóstico / Motivo:
                            </span>{' '}
                            {entry.diagnosis}
                          </p>
                        )}
                        {entry.receptionNotes && (
                          <p className="mt-1">
                            <span className="font-semibold text-muted-foreground">
                              Notas de ingreso:
                            </span>{' '}
                            {entry.receptionNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Servicios realizados y repuestos consumidos */}
                    <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                      {/* Servicios */}
                      <div className="rounded-xl border border-border/70 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Wrench size={13} className="text-primary" /> Servicios realizados (
                          {entry.services.length})
                        </p>
                        {entry.services.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Sin servicios mano de obra detallados.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-1.5 text-xs divide-y divide-border/40">
                            {entry.services.map((srv) => (
                              <li
                                key={srv.id}
                                className="flex items-center justify-between pt-1"
                              >
                                <span className="truncate pr-2">{srv.name}</span>
                                <span className="font-medium text-foreground tabular-nums shrink-0">
                                  S/ {srv.subtotal.toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Repuestos */}
                      <div className="rounded-xl border border-border/70 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Package size={13} className="text-emerald-600" /> Repuestos y consumibles (
                          {entry.parts.length})
                        </p>
                        {entry.parts.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Sin repuestos facturados.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-1.5 text-xs divide-y divide-border/40">
                            {entry.parts.map((prt) => (
                              <li
                                key={prt.id}
                                className="flex items-center justify-between pt-1"
                              >
                                <span className="truncate pr-2">
                                  {prt.quantity} {prt.unitLabel ?? 'und'} · {prt.name}
                                </span>
                                <span className="font-medium text-foreground tabular-nums shrink-0">
                                  S/ {prt.subtotal.toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
