import { useDeferredValue, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
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
  pageSize: 10,
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
            Catálogo de servicios
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

      <ModuleMetrics
        items={[
          { label: 'Servicios encontrados', value: total },
          {
            label: 'Servicios activos',
            value: activeCount,
            valueLabel: 'en esta página',
            tone: 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de servicios"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <ServicesToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleServices.map((service) => ({
            value: service.code,
            label: `${service.name} · ${service.code}`,
          }))}
        />
      </section>

      <section
        aria-label="Resultados de servicios"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
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
            loading={services.isPending || services.isFetching}
            canWrite={canWrite}
            onEdit={(service) => {
              setEditingService(service)
              setServiceFormOpen(true)
            }}
            onToggleStatus={setServiceToToggle}
          />
        )}

        {services.data && (
          <Pagination
            page={filters.page}
            totalPages={services.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
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
