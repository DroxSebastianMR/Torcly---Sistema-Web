import { useState } from 'react'
import { ArrowLeft, Car, History, Pencil, UsersRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/app/router/constants/paths'
import {
  dateFormatter,
  documentLabel,
} from '@/features/customers/utils/customer-formatters'
import { workOrdersService } from '@/features/work-orders/services/work-orders.service'
import type { WorkOrderVehicleHistoryItem } from '@/features/work-orders/types/work-orders.types'
import {
  dateTimeFormatter,
  currencyFormatter,
  quantityFormatter,
} from '@/features/work-orders/utils/work-order-formatters'
import { VehicleFormModal } from '../components/vehicle-form-modal'
import { useVehicle } from '../hooks/use-vehicles'
import type { Vehicle } from '../types/vehicles.types'
import {
  vehicleOwnerDisplay,
  vehicleOwnerInitials,
} from '../utils/vehicle-formatters'

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'vehicles:write',
  )
  const canRead = hasPermission(currentUser?.permissions ?? [], 'workshop:read')
  const vehicle = useVehicle(id ?? '')
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const vehicleHistory = useQuery({
    queryKey: ['work-orders', 'vehicle-history', id, historyPage],
    queryFn: ({ signal }) =>
      workOrdersService.vehicleHistory(id ?? '', historyPage, 10, signal),
    enabled: Boolean(id) && canRead,
  })

  if (vehicle.isPending) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="flex animate-pulse items-center gap-4">
          <div className="size-16 rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (vehicle.isError || !vehicle.data) {
    return (
      <ErrorState
        title="No se pudo cargar la ficha del vehículo"
        description="Verifica que exista un vehículo con esta placa o identificador e inténtalo nuevamente."
        busy={vehicle.isFetching}
        action={{
          label: 'Reintentar',
          onClick: () => void vehicle.refetch(),
        }}
      />
    )
  }

  const details = vehicle.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate(paths.vehicles)}>
          <ArrowLeft size={16} /> Volver a vehículos
        </Button>
        {canWrite && (
          <Button
            onClick={() => {
              setEditingVehicle(details)
              setFormOpen(true)
            }}
          >
            <Pencil size={16} /> Editar vehículo
          </Button>
        )}
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_10px_35px_rgba(16,44,37,0.04)] sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-primary">
          <Car size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-2xl font-bold tracking-wide text-brand-forest">
            {details.plate}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {details.brand} {details.model} · {details.year}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <header className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
            Datos del vehículo
          </h2>
        </header>
        <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
          <Datum label="Placa" value={details.plate} mono />
          <Datum label="Marca" value={details.brand} />
          <Datum label="Modelo" value={details.model} />
          <Datum label="Año" value={String(details.year)} />
          <Datum label="Registrado" value={dateFormatter(details.createdAt)} />
          <Datum
            label="Última actualización"
            value={dateFormatter(details.updatedAt)}
          />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <UsersRound size={16} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
              Propietario
            </h2>
          </header>
          <div className="flex items-center gap-4 px-5 py-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-sm font-bold text-primary">
              {vehicleOwnerInitials(details.owner)}
            </span>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() =>
                  navigate(`${paths.customers}/${details.customerId}`)
                }
                className="block max-w-64 truncate text-left font-semibold text-foreground hover:text-primary"
              >
                {vehicleOwnerDisplay(details.owner)}
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                {documentLabel(details.owner.type)}{' '}
                {details.owner.documentNumber} · abrir ficha del cliente
              </p>
            </div>
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <History size={16} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
              Historial técnico
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {vehicleHistory.data?.pagination.total ?? 0}{' '}
              {vehicleHistory.data?.pagination.total === 1
                ? 'orden entregada'
                : 'órdenes entregadas'}
            </span>
          </header>
          {!canRead ? (
            <EmptyState
              icon={History}
              title="Historial técnico en blanco"
              description="Las intervenciones y visitas al taller aparecerán aquí con fecha y detalle."
            />
          ) : vehicleHistory.isPending ? (
            <div className="divide-y" aria-label="Cargando historial técnico">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex animate-pulse gap-4 px-5 py-4">
                  <div className="size-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-48 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : vehicleHistory.isError ? (
            <EmptyState
              icon={History}
              title="No se pudo cargar el historial"
              description="Verifica la conexión con la API e inténtalo nuevamente."
            />
          ) : (vehicleHistory.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              icon={History}
              title="Sin intervenciones registradas"
              description="Cuando una orden se entregue, aparecerá aquí con sus actividades y repuestos."
            />
          ) : (
            <>
              <div className="divide-y">
                {(vehicleHistory.data?.data ?? []).map((entry) => (
                  <HistoryEntry key={entry.id} entry={entry} />
                ))}
              </div>
              {vehicleHistory.data &&
                vehicleHistory.data.pagination.totalPages > 1 && (
                  <footer className="flex items-center justify-between border-t px-5 py-4 text-sm">
                    <span className="text-muted-foreground">
                      Página {historyPage} de{' '}
                      {vehicleHistory.data.pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage((current) => current - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        disabled={
                          historyPage >=
                          vehicleHistory.data.pagination.totalPages
                        }
                        onClick={() => setHistoryPage((current) => current + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </footer>
                )}
            </>
          )}
        </section>
      </div>

      <VehicleFormModal
        open={formOpen}
        vehicle={editingVehicle}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function Datum({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-medium ${mono ? 'font-mono font-bold' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

function HistoryEntry({ entry }: { entry: WorkOrderVehicleHistoryItem }) {
  return (
    <article className="flex gap-4 px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
        <History size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-sm font-semibold">{entry.code}</p>
          <p className="text-xs text-muted-foreground">
            {entry.deliveredAt
              ? dateTimeFormatter.format(new Date(entry.deliveredAt))
              : ''}
          </p>
        </div>
        {entry.diagnosis && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {entry.diagnosis}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {entry.technician && <span>Técnico: {entry.technician}</span>}
          <span>
            {entry.activities.length}{' '}
            {entry.activities.length === 1 ? 'actividad' : 'actividades'}
          </span>
          {entry.products.length > 0 && (
            <span className="tabular-nums">
              {entry.products
                .map(
                  (product) =>
                    `${quantityFormatter.format(product.quantity)}${
                      product.unitLabel ? ` ${product.unitLabel}` : ''
                    } ${product.name}`,
                )
                .join(', ')}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold tabular-nums">
          {currencyFormatter.format(entry.total)}
        </p>
      </div>
    </article>
  )
}
