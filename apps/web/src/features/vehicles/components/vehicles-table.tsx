import { Car, Eye, MoreHorizontal, Pencil, UsersRound } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { documentLabel } from '@/features/customers/utils/customer-formatters'
import type { Vehicle } from '../types/vehicles.types'
import { vehicleOwnerDisplay } from '../utils/vehicle-formatters'

interface VehiclesTableProps {
  vehicles: Vehicle[]
  loading: boolean
  canWrite: boolean
  onOpenDetail: (vehicle: Vehicle) => void
  onOpenOwner: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
}

export function VehiclesTable({
  vehicles,
  loading,
  canWrite,
  onOpenDetail,
  onOpenOwner,
  onEdit,
}: VehiclesTableProps) {
  if (loading) return <VehiclesSkeleton />

  if (!vehicles.length) {
    return (
      <EmptyState
        icon={Car}
        title="No se encontraron vehículos"
        description="Ajusta la búsqueda o registra la primera unidad del parque automotor."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Placa</th>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Propietario</th>
              <th className="w-24 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="group hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(vehicle)}
                    className="font-mono text-sm font-bold tracking-wide text-foreground hover:text-primary"
                  >
                    {vehicle.plate}
                  </button>
                </td>
                <td className="px-4 py-4">{vehicle.brand}</td>
                <td className="px-4 py-4 text-muted-foreground">
                  {vehicle.model}
                </td>
                <td className="px-4 py-4 tabular-nums text-muted-foreground">
                  {vehicle.year}
                </td>
                <td className="px-4 py-4">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenOwner(vehicle)}
                      className="block max-w-56 truncate text-left font-medium hover:text-primary"
                    >
                      {vehicleOwnerDisplay(vehicle.owner)}
                    </button>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {documentLabel(vehicle.owner.type)}{' '}
                      {vehicle.owner.documentNumber}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                    <ActionButton
                      label={`Ver ficha de ${vehicle.plate}`}
                      title="Ver ficha"
                      onClick={() => onOpenDetail(vehicle)}
                    >
                      <Eye size={16} />
                    </ActionButton>
                    <ActionButton
                      label={`Editar ${vehicle.plate}`}
                      title="Editar datos"
                      onClick={() => onEdit(vehicle)}
                      disabled={!canWrite}
                    >
                      <Pencil size={16} />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono font-bold tracking-wide">
                  {vehicle.plate}
                </p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {vehicle.brand} {vehicle.model} · {vehicle.year}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {vehicleOwnerDisplay(vehicle.owner)} ·{' '}
                  {vehicle.owner.documentNumber}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => onOpenDetail(vehicle)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium"
              >
                <Eye size={15} /> Ver ficha
              </button>
              <button
                type="button"
                onClick={() => onOpenOwner(vehicle)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
              >
                <UsersRound size={15} /> Propietario
              </button>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => onEdit(vehicle)}
                  className="flex size-10 items-center justify-center rounded-lg border"
                  aria-label={`Editar ${vehicle.plate}`}
                  title="Editar datos"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function ActionButton({
  label,
  title,
  onClick,
  disabled,
  children,
}: {
  label: string
  title: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function VehiclesSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando vehículos">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-28 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
