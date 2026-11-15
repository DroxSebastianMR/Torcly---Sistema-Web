import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/app/router/constants/paths'
import { QuotationsTable } from '../components/quotations-table'
import { QuotationFormModal } from '../components/quotation-form-modal'
import { QuotationDetailModal } from '../components/quotation-detail-modal'
import {
  useQuotation,
  useQuotations,
  useQuotationMutations,
} from '../hooks/use-quotations'
import type {
  QuotationCreateInput,
  QuotationDetail,
  QuotationFilters,
  QuotationStatusFilter,
  QuotationSummary,
} from '../types/quotations.types'

const initialFilters: QuotationFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 10,
}

function useDebouncedValue<T>(value: T, delay = 280) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeoutId)
  }, [delay, value])
  return debouncedValue
}

export default function QuotationsPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(currentUser?.permissions ?? [], 'sales:write')

  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] =
    useState<QuotationDetail | null>(null)

  const debouncedSearch = useDebouncedValue(filters.search)
  const queryFilters = { ...filters, search: debouncedSearch }

  const quotations = useQuotations(queryFilters)
  const detail = useQuotation(selectedId ?? '')
  const mutations = useQuotationMutations()

  const total = quotations.data?.pagination.total ?? 0
  const visibleQuotations = quotations.data?.data ?? []

  const draftCount = visibleQuotations.filter(
    (q) => q.status === 'DRAFT',
  ).length
  const sentCount = visibleQuotations.filter((q) => q.status === 'SENT').length
  const approvedCount = visibleQuotations.filter(
    (q) => q.status === 'APPROVED',
  ).length

  const openCreate = () => {
    setEditingQuotation(null)
    setFormOpen(true)
  }

  const handleFormSubmit = async (input: QuotationCreateInput) => {
    try {
      if (editingQuotation) {
        await mutations.update.mutateAsync({
          id: editingQuotation.id,
          input,
        })
        toast.success('Presupuesto actualizado correctamente.')
      } else {
        await mutations.create.mutateAsync(input)
        toast.success('Presupuesto guardado exitosamente.')
      }
      setFormOpen(false)
    } catch {
      toast.error('No se pudo guardar la cotización.')
    }
  }

  const handleConvertToOrder = async (
    quotation: QuotationSummary | QuotationDetail,
  ) => {
    if (!quotation.customer || !quotation.vehicle) {
      toast.error(
        'La cotización debe tener un cliente y un vehículo asignados para convertirse en orden de taller.',
      )
      return
    }

    try {
      const result = await mutations.convertToOrder.mutateAsync(quotation.id)
      toast.success(
        `¡Cotización aprobada! Se generó la orden de taller ${result.data.workOrder.code}`,
      )
      setSelectedId(null)
      navigate(paths.workOrders)
    } catch {
      toast.error('No se pudo convertir la cotización a orden de taller.')
    }
  }

  const statusTabs: Array<{ id: QuotationStatusFilter; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'DRAFT', label: 'Borradores' },
    { id: 'SENT', label: 'Enviadas' },
    { id: 'APPROVED', label: 'Aprobadas' },
    { id: 'EXPIRED', label: 'Vencidas' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión comercial"
        title="Cotizaciones"
        description="Elabora cotizaciones para tus clientes, compártelas por WhatsApp y conviértelas a órdenes de taller con un clic."
      >
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus size={17} className="mr-1.5" /> Nueva cotización
          </Button>
        )}
      </PageHeader>

      <ModuleMetrics
        items={[
          {
            label: 'Cotizaciones',
            value: total,
            valueLabel: 'encontradas',
          },
          {
            label: 'Borradores',
            value: draftCount,
            valueLabel: 'en esta página',
            tone: 'warning',
          },
          {
            label: 'Enviadas',
            value: sentCount,
            valueLabel: 'en esta página',
            tone: 'info',
          },
          {
            label: 'Aprobadas',
            value: approvedCount,
            valueLabel: 'en esta página',
            tone: 'success',
          },
        ]}
      />

      {/* Barra de Filtros y Búsqueda */}
      <section
        aria-label="Filtros de cotizaciones"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Buscar por código, cliente o placa…"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: tab.id,
                    page: 1,
                  }))
                }
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filters.status === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tabla de Resultados */}
      <section
        aria-label="Resultados de cotizaciones"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        {quotations.isError ? (
          <ErrorState
            title="No se pudieron cargar las cotizaciones"
            description="Verifica la conexión con el servidor e inténtalo nuevamente."
            busy={quotations.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void quotations.refetch(),
            }}
          />
        ) : (
          <QuotationsTable
            quotations={visibleQuotations}
            loading={quotations.isFetching}
            workshopName={currentUser?.name || 'Torcly Taller'}
            onOpen={(q) => setSelectedId(q.id)}
            onConvertToOrder={handleConvertToOrder}
          />
        )}

        {quotations.data && (
          <Pagination
            page={filters.page}
            totalPages={quotations.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>

      {/* Modal de Detalle */}
      <QuotationDetailModal
        open={Boolean(selectedId)}
        quotation={detail.data ?? null}
        loading={detail.isPending}
        workshopName={currentUser?.name || 'Torcly Taller'}
        onClose={() => setSelectedId(null)}
        onConvertToOrder={handleConvertToOrder}
      />

      {/* Modal de Formulario */}
      {formOpen && (
        <QuotationFormModal
          open={formOpen}
          quotation={editingQuotation}
          loading={mutations.create.isPending || mutations.update.isPending}
          onClose={() => setFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}
