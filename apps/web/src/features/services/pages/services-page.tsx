import { useDeferredValue, useState } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { ServiceFormModal } from '../components/service-form-modal'
import { ServicesTable } from '../components/services-table'
import { ServicesToolbar } from '../components/services-toolbar'
import { useServices, useServiceMutations } from '../hooks/use-services'
import type { Service, ServiceFilters } from '../types/services.types'
import { getServiceErrorMessage } from '../utils/service-formatters'

const initialFilters: ServiceFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'services:write',
  )
  const [filters, setFilters] = useState(initialFilters)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [serviceToToggle, setServiceToToggle] = useState<Service | null>(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const services = useServices(queryFilters)
  const mutations = useServiceMutations()
  const total = services.data?.pagination.total ?? 0
  const visibleServices = services.data?.data ?? []
  const activeCount = visibleServices.filter((service) => service.active).length

  const openCreate = () => {
    setEditingService(null)
    setServiceFormOpen(true)
  }

  const toggleStatus = async (service: Service) => {
    try {
      await mutations.status.mutateAsync({
        id: service.id,
        active: !service.active,
      })
      toast.success(`Servicio ${service.active ? 'desactivado' : 'activado'}.`)
    } catch (error) {
      toast.error(getServiceErrorMessage(error))
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Wrench size={15} /> Catálogo de servicios
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Servicios
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Administra la tarifa de servicios automotrices disponibles para las
            operaciones del taller.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus size={17} /> Registrar servicio
          </Button>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                servicios encontrados
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {activeCount}
            </p>
            <p className="text-xs text-muted-foreground">
              activos en esta página
            </p>
          </div>
          {services.isFetching && !services.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

        <ServicesToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleServices.map((service) => ({
            value: service.code,
            label: `${service.name} · ${service.code}`,
          }))}
        />

        {services.isError ? (
          <ErrorState
            title="No se pudo cargar el catálogo de servicios"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={services.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void services.refetch(),
            }}
          />
        ) : (
          <ServicesTable
            services={visibleServices}
            loading={services.isPending}
            canWrite={canWrite}
            onEdit={(service) => {
              setEditingService(service)
              setServiceFormOpen(true)
            }}
            onToggleStatus={setServiceToToggle}
          />
        )}

        {services.data && services.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {services.data.pagination.totalPages}
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
                disabled={filters.page >= services.data.pagination.totalPages}
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

      <ServiceFormModal
        open={serviceFormOpen}
        service={editingService}
        onClose={() => setServiceFormOpen(false)}
      />
      <ConfirmationDialog
        open={Boolean(serviceToToggle)}
        title={
          serviceToToggle?.active
            ? '¿Desactivar servicio?'
            : '¿Activar servicio?'
        }
        description={
          serviceToToggle?.active
            ? `“${serviceToToggle.name}” dejará de estar disponible para las operaciones del taller.`
            : `“${serviceToToggle?.name ?? ''}” volverá a estar disponible para las operaciones del taller.`
        }
        variant={serviceToToggle?.active ? 'danger' : 'success'}
        confirmLabel={serviceToToggle?.active ? 'Desactivar' : 'Activar'}
        onCancel={() => setServiceToToggle(null)}
        onConfirm={async () => {
          if (!serviceToToggle) return
          await toggleStatus(serviceToToggle)
        }}
      />
    </div>
  )
}
