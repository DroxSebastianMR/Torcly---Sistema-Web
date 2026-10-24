import { useState } from 'react'
import { Building2, Plus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { PurchaseDetailModal } from '../components/purchase-detail-modal'
import { PurchaseFormModal } from '../components/purchase-form-modal'
import { PurchasesTable } from '../components/purchases-table'
import { PurchasesToolbar } from '../components/purchases-toolbar'
import { SuppliersModal } from '../components/suppliers-modal'
import { usePurchases } from '../hooks/use-purchases'
import type {
  PurchaseDetail,
  PurchaseFilters,
  PurchaseSummary,
} from '../types/purchases.types'

const initialFilters: PurchaseFilters = {
  status: 'all',
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user } = useAuth()
  const canWrite = hasPermission(user?.permissions ?? [], 'purchases:write')
  const [filters, setFilters] = useState<PurchaseFilters>(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<PurchaseDetail | null>(
    null,
  )
  const [suppliersModalOpen, setSuppliersModalOpen] = useState(false)

  const purchases = usePurchases(filters)
  const total = purchases.data?.pagination.total ?? 0
  const totalPages = purchases.data?.pagination.totalPages ?? 1
  const visiblePurchases = purchases.data?.data ?? []

  const handleFilterChange = (partial: Partial<PurchaseFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  const openCreate = () => {
    setEditingPurchase(null)
    setFormOpen(true)
  }

  const openDetail = (purchase: PurchaseSummary) => {
    setSelectedId(purchase.id)
  }

  const openEdit = (purchase: PurchaseDetail) => {
    setSelectedId(null)
    setEditingPurchase(purchase)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <ShoppingBag size={15} /> Abastecimiento
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Compras
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registra compras a proveedores, confirma recepciones de inventario y
            consulta el historial trazable e inmutable.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => setSuppliersModalOpen(true)}
            className="gap-1.5"
          >
            <Building2 size={16} />
            Proveedores
          </Button>
          {canWrite && (
            <Button onClick={openCreate} className="gap-1.5">
              <Plus size={17} />
              Nueva compra
            </Button>
          )}
        </div>
      </header>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
          {visiblePurchases.filter((p) => p.status === 'DRAFT').length}{' '}
          borradores
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {visiblePurchases.filter((p) => p.status === 'RECEIVED').length}{' '}
          recibidas
        </div>
        <span className="ml-auto text-muted-foreground">
          {total} {total === 1 ? 'compra registrada' : 'compras registradas'}
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <PurchasesToolbar
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </div>

        {purchases.isError ? (
          <ErrorState
            title="No se pudieron cargar las compras"
            action={{
              label: 'Reintentar',
              onClick: () => purchases.refetch(),
            }}
          />
        ) : (
          <PurchasesTable
            purchases={visiblePurchases}
            loading={purchases.isLoading}
            onOpen={openDetail}
          />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-muted-foreground">
            <span>
              Página {filters.page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={filters.page <= 1}
                onClick={() => handleFilterChange({ page: filters.page - 1 })}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                className="h-8 px-3 text-xs"
                disabled={filters.page >= totalPages}
                onClick={() => handleFilterChange({ page: filters.page + 1 })}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </section>

      <PurchaseDetailModal
        purchaseId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={openEdit}
      />

      <PurchaseFormModal
        open={formOpen}
        purchase={editingPurchase}
        onClose={() => {
          setFormOpen(false)
          setEditingPurchase(null)
        }}
      />

      <SuppliersModal
        open={suppliersModalOpen}
        onClose={() => setSuppliersModalOpen(false)}
      />
    </div>
  )
}
