import { useDeferredValue, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { CustomerDetailModal } from '@/features/customers/components/customer-detail-modal'
import { VehicleFormModal } from '../components/vehicle-form-modal'
import { VehicleDetailModal } from '../components/vehicle-detail-modal'
import { VehiclesTable } from '../components/vehicles-table'
import { VehiclesToolbar } from '../components/vehicles-toolbar'
import { useVehicles } from '../hooks/use-vehicles'
import type { Vehicle, VehicleFilters } from '../types/vehicles.types'
import { vehicleOwnerDisplay } from '../utils/vehicle-formatters'

const initialFilters: VehicleFilters = {
  search: '',
  page: 1,
  pageSize: 10,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'vehicles:write',
  )
  const [filters, setFilters] = useState(initialFilters)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null)
  const [detailOwnerId, setDetailOwnerId] = useState<string | null>(null)
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
            Parque automotor
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

      <ModuleMetrics
        items={[
          {
            label:
              total === 1 ? 'Vehículo registrado' : 'Vehículos registrados',
            value: total,
          },
          {
            label: 'Marcas distintas en esta página',
            value: brandsOnPage,
            tone: 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de vehículos"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
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
      </section>

      <section
        aria-label="Resultados de vehículos"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
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
            loading={vehicles.isPending || vehicles.isFetching}
            canWrite={canWrite}
            onOpenDetail={setDetailVehicle}
            onOpenOwner={(vehicle) => setDetailOwnerId(vehicle.customerId)}
            onEdit={(vehicle) => {
              setEditingVehicle(vehicle)
              setFormOpen(true)
            }}
          />
        )}

        {vehicles.data && vehicles.data.pagination.totalPages > 1 && (
          <Pagination
            page={filters.page}
            totalPages={vehicles.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>

      <VehicleFormModal
        open={formOpen}
        vehicle={editingVehicle}
        onClose={() => setFormOpen(false)}
      />
      {detailVehicle && (
        <VehicleDetailModal
          open
          vehicle={detailVehicle}
          canWrite={canWrite}
          onClose={() => setDetailVehicle(null)}
          onEdit={(vehicle) => {
            setDetailVehicle(null)
            setEditingVehicle(vehicle)
            setFormOpen(true)
          }}
        />
      )}
      {detailOwnerId && (
        <CustomerDetailModal
          open
          customerId={detailOwnerId}
          canWrite={false}
          onClose={() => setDetailOwnerId(null)}
          onEdit={() => undefined}
        />
      )}
    </div>
  )
}
