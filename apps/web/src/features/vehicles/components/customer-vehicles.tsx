import { Car, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { paths } from '@/app/router/constants/paths'
import { useVehiclesByCustomer } from '../hooks/use-vehicles'

interface CustomerVehiclesProps {
  customerId: string
}

export function CustomerVehicles({ customerId }: CustomerVehiclesProps) {
  const navigate = useNavigate()
  const vehicles = useVehiclesByCustomer(customerId)

  if (vehicles.isPending) {
    return (
      <div aria-label="Cargando vehículos del cliente">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 px-5 py-4"
          >
            <div className="size-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-2.5 w-24 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (vehicles.isError) {
    return (
      <div className="p-5">
        <ErrorState
          title="No se pudo cargar los vehículos"
          description="Intenta nuevamente en unos segundos."
          busy={vehicles.isFetching}
          action={{
            label: 'Reintentar',
            onClick: () => void vehicles.refetch(),
          }}
        />
      </div>
    )
  }

  const items = vehicles.data?.data ?? []

  if (!items.length) {
    return (
      <EmptyState
        icon={Car}
        title="Todavía no hay vehículos"
        description="Cuando se asocie una unidad, verás aquí la placa, marca y modelo del vehículo."
      />
    )
  }

  return (
    <ul className="divide-y">
      {items.map((vehicle) => (
        <li key={vehicle.id}>
          <button
            type="button"
            onClick={() => navigate(`${paths.vehicles}/${vehicle.id}`)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#f9fbfa]"
            aria-label={`Ver ficha de ${vehicle.plate}`}
          >
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold tracking-wide">
                {vehicle.plate}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">
                {vehicle.year}
              </span>
              <ChevronRight
                aria-hidden
                size={16}
                className="text-muted-foreground"
              />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
