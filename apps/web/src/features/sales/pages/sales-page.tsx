import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { SaleDetailModal } from '../components/sale-detail-modal'
import { SaleCancelModal } from '../components/sale-cancel-modal'
import { SaleFormModal } from '../components/sale-form-modal'
import { SalesTable } from '../components/sales-table'
import { SalesToolbar } from '../components/sales-toolbar'
import { useSale, useSales } from '../hooks/use-sales'
import type { SaleDetail, SaleFilters } from '../types/sales.types'

const initialFilters: SaleFilters = {
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

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(currentUser?.permissions ?? [], 'sales:write')
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<SaleDetail | null>(null)
  const [cancellingSale, setCancellingSale] = useState<SaleDetail | null>(null)
  const debouncedSearch = useDebouncedValue(filters.search)
  const queryFilters = { ...filters, search: debouncedSearch }
  const sales = useSales(queryFilters)
  const detail = useSale(selectedId ?? '')
  const total = sales.data?.pagination.total ?? 0
  const visibleSales = sales.data?.data ?? []
  const draftCount = visibleSales.filter(
    (sale) => sale.status === 'DRAFT',
  ).length
  const confirmedCount = visibleSales.filter(
    (sale) => sale.status === 'CONFIRMED',
  ).length

  const openCreate = () => {
    setEditingSale(null)
    setFormOpen(true)
  }

  const openDetail = (saleId: string) => {
    setSelectedId(saleId)
  }

  const editDetail = (sale: SaleDetail) => {
    setSelectedId(null)
    setEditingSale(sale)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Punto de venta
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Ventas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registra ventas en borrador, confirma las que generan salida de
            inventario y consulta el historial.
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus size={17} /> Nueva venta
          </Button>
        )}
      </header>

      <ModuleMetrics
        items={[
          {
            label: 'Ventas',
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
            label: 'Confirmadas',
            value: confirmedCount,
            valueLabel: 'en esta página',
            tone: 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de ventas"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <SalesToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleSales.map((sale) => ({
            value: sale.code,
            label: `${sale.code} · ${sale.customer?.name ?? 'Sin cliente'}`,
            searchTerms: [
              sale.code,
              sale.customer?.name ?? '',
              sale.customer?.documentNumber ?? '',
            ],
          }))}
        />
      </section>

      <section
        aria-label="Resultados de ventas"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        {sales.isError ? (
          <ErrorState
            title="No se pudo cargar las ventas"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={sales.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void sales.refetch(),
            }}
          />
        ) : (
          <SalesTable
            sales={visibleSales}
            loading={sales.isFetching}
            onOpen={(sale) => openDetail(sale.id)}
          />
        )}

        {sales.data && (
          <Pagination
            page={filters.page}
            totalPages={sales.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>

      <SaleDetailModal
        open={Boolean(selectedId)}
        sale={detail.data ?? null}
        loading={detail.isPending}
        canEdit={canWrite}
        onClose={() => setSelectedId(null)}
        onEdit={editDetail}
        onCancelSale={(sale) => {
          setSelectedId(null)
          setCancellingSale(sale)
        }}
      />
      <SaleFormModal
        open={formOpen}
        sale={editingSale}
        onClose={() => {
          setFormOpen(false)
          setEditingSale(null)
        }}
      />
      <SaleCancelModal
        open={Boolean(cancellingSale)}
        sale={cancellingSale}
        onClose={() => setCancellingSale(null)}
      />
    </div>
  )
}
