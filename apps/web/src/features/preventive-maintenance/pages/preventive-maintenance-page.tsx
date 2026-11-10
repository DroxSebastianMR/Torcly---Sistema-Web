import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SmartSelect } from '@/components/ui/smart-select'
import { ErrorState } from '@/components/ui/error-state'
import { Pagination } from '@/components/ui/pagination'
import { usePreventiveMaintenance } from '../hooks/use-preventive-maintenance'
import { PreventiveMaintenanceMetricsCards } from '../components/preventive-maintenance-metrics'
import { PreventiveMaintenanceTable } from '../components/preventive-maintenance-table'
import type { PreventiveMaintenanceFilters } from '../types/preventive-maintenance.types'

const initialFilters: PreventiveMaintenanceFilters = {
  priority: 'all',
  search: '',
}

const PAGE_SIZE = 10

export default function PreventiveMaintenancePage() {
  const [filters, setFilters] = useState<PreventiveMaintenanceFilters>(initialFilters)
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, refetch } = usePreventiveMaintenance(filters)

  const items = data?.data ?? []
  const metrics = data?.metrics

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange = (
    updater: (prev: PreventiveMaintenanceFilters) => PreventiveMaintenanceFilters,
  ) => {
    setFilters(updater)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado estandarizado con el patrón Ventas */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Fidelización y taller
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Mantenimiento Preventivo
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Detecta automáticamente vehículos que requieren cambio de aceite o servicio periódico
            y genera campañas de contacto por WhatsApp para agendar su retorno al taller.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-xs dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CalendarClock className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>Frecuencia sugerida: 5,000 km o 6 meses</span>
        </div>
      </header>

      {/* Tarjetas de métricas de parque vehicular */}
      <PreventiveMaintenanceMetricsCards metrics={metrics} isLoading={isLoading} />

      {/* Barra de herramientas y filtros */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
          <div>
            <label className="sr-only" htmlFor="maintenance-search">
              Buscar vehículo o cliente
            </label>
            <Input
              id="maintenance-search"
              value={filters.search}
              onChange={(e) =>
                handleFilterChange((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Buscar por placa, cliente o teléfono..."
            />
          </div>

          <div>
            <SmartSelect
              value={filters.priority}
              onChange={(value) =>
                handleFilterChange((prev) => ({
                  ...prev,
                  priority: value as PreventiveMaintenanceFilters['priority'],
                }))
              }
              options={[
                { value: 'all', label: 'Todas las prioridades' },
                {
                  value: 'CRITICAL',
                  label: 'Vencido (>6 meses)',
                  icon: (
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-rose-500 shrink-0"
                    />
                  ),
                },
                {
                  value: 'WARNING',
                  label: 'Por vencer (5-6 meses)',
                  icon: (
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-amber-500 shrink-0"
                    />
                  ),
                },
                {
                  value: 'UP_TO_DATE',
                  label: 'Al día (<5 meses)',
                  icon: (
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-emerald-500 shrink-0"
                    />
                  ),
                },
              ]}
              placeholder="Filtrar por prioridad"
              searchThreshold={10}
              aria-label="Filtro de prioridad de mantenimiento"
            />
          </div>
        </div>
      </section>

      {/* Tabla de recordatorios */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isError ? (
          <div className="p-8">
            <ErrorState
              title="No se pudieron cargar las alertas preventivas"
              description="Verifica la conexión con el servidor o inténtalo nuevamente."
              action={{
                label: 'Reintentar',
                onClick: () => void refetch(),
              }}
            />
          </div>
        ) : (
          <>
            <PreventiveMaintenanceTable items={paginatedItems} isLoading={isLoading} />
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>
    </div>
  )
}
