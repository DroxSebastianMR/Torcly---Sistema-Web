import { useDeferredValue, useState } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { SaleDetailModal } from '../components/sale-detail-modal'
import { SaleFormModal } from '../components/sale-form-modal'
import { SalesTable } from '../components/sales-table'
import { SalesToolbar } from '../components/sales-toolbar'
import { useSale, useSales } from '../hooks/use-sales'
import type { SaleDetail, SaleFilters } from '../types/sales.types'

const initialFilters: SaleFilters = {
  search: '',
  status: 'all',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(currentUser?.permissions ?? [], 'sales:write')
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<SaleDetail | null>(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
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
            <ShoppingCart size={15} /> Punto de venta
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

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                ventas encontradas
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-amber-600">
              {draftCount}
            </p>
            <p className="text-xs text-muted-foreground">
              borradores en esta página
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {confirmedCount}
            </p>
            <p className="text-xs text-muted-foreground">
              confirmadas en esta página
            </p>
          </div>
          {sales.isFetching && !sales.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

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
            loading={sales.isPending}
            onOpen={(sale) => openDetail(sale.id)}
          />
        )}

        {sales.data && sales.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {sales.data.pagination.totalPages}
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
                disabled={filters.page >= sales.data.pagination.totalPages}
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

      <SaleDetailModal
        open={Boolean(selectedId)}
        sale={detail.data ?? null}
        loading={detail.isPending}
        canEdit={canWrite}
        onClose={() => setSelectedId(null)}
        onEdit={editDetail}
      />
      <SaleFormModal
        open={formOpen}
        sale={editingSale}
        onClose={() => {
          setFormOpen(false)
          setEditingSale(null)
        }}
      />
    </div>
  )
}
