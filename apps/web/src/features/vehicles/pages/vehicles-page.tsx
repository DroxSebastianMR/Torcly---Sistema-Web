import { useDeferredValue, useState } from 'react'
import { Car, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/app/router/constants/paths'
import { VehicleFormModal } from '../components/vehicle-form-modal'
import { VehiclesTable } from '../components/vehicles-table'
import { VehiclesToolbar } from '../components/vehicles-toolbar'
import { useVehicles } from '../hooks/use-vehicles'
import type { Vehicle, VehicleFilters } from '../types/vehicles.types'
import { vehicleOwnerDisplay } from '../utils/vehicle-formatters'

const initialFilters: VehicleFilters = {
  search: '',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'vehicles:write',
  )
  const navigate = useNavigate()

  const [filters, setFilters] = useState(initialFilters)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const vehicles = useVehicles(queryFilters)
  const total = vehicles.data?.pagination.total ?? 0
  const visibleVehicles = vehicles.data?.data ?? []
  const brandsOnPage = new Set(
    visibleVehicles.map((vehicle) => vehicle.brand.toLocaleLowerCase('es')),
  ).size

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Car size={15} /> Parque automotor
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Vehículos
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registra las unidades de tus clientes y consulta su ficha con la
            placa, marca, modelo, año y propietario.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setEditingVehicle(null)
              setFormOpen(true)
            }}
          >
            <Plus size={17} /> Registrar vehículo
          </Button>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Car size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                {total === 1 ? 'vehículo registrado' : 'vehículos registrados'}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {brandsOnPage}
            </p>
            <p className="text-xs text-muted-foreground">
              marcas distintas en esta página
            </p>
          </div>
          {vehicles.isFetching && !vehicles.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

        <VehiclesToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleVehicles.map((vehicle) => ({
            value: vehicle.plate,
            label: `${vehicle.plate} · ${vehicle.brand} ${vehicle.model}`,
            searchTerms: [
              vehicle.plate,
              vehicle.owner.documentNumber,
              vehicleOwnerDisplay(vehicle.owner),
            ],
          }))}
        />

        {vehicles.isError ? (
          <ErrorState
            title="No se pudo cargar los vehículos"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={vehicles.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void vehicles.refetch(),
            }}
          />
        ) : (
          <VehiclesTable
            vehicles={visibleVehicles}
            loading={vehicles.isPending}
            canWrite={canWrite}
            onOpenDetail={(vehicle) =>
              navigate(`${paths.vehicles}/${vehicle.id}`)
            }
            onOpenOwner={(vehicle) =>
              navigate(`${paths.customers}/${vehicle.customerId}`)
            }
            onEdit={(vehicle) => {
              setEditingVehicle(vehicle)
              setFormOpen(true)
            }}
          />
        )}

        {vehicles.data && vehicles.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {vehicles.data.pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={filters.page >= vehicles.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Siguiente
              </Button>
            </div>
          </footer>
        )}
      </section>

      <VehicleFormModal
        open={formOpen}
        vehicle={editingVehicle}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
