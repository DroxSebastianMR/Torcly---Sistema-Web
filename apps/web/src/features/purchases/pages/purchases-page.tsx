import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
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
            Abastecimiento
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

      <ModuleMetrics
        items={[
          { label: 'Compras registradas', value: total },
          {
            label: 'Borradores',
            value: visiblePurchases.filter(
              (purchase) => purchase.status === 'DRAFT',
            ).length,
            valueLabel: 'en esta página',
            tone: 'warning',
          },
          {
            label: 'Recibidas',
            value: visiblePurchases.filter(
              (purchase) => purchase.status === 'RECEIVED',
            ).length,
            valueLabel: 'en esta página',
            tone: 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de compras"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <PurchasesToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </section>

      <section
        aria-label="Resultados de compras"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
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

        <Pagination
          page={filters.page}
          totalPages={totalPages}
          onPageChange={(page) => handleFilterChange({ page })}
        />
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
