import { useDeferredValue, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { CustomerDetailModal } from '../components/customer-detail-modal'
import { CustomerFormModal } from '../components/customer-form-modal'
import { CustomersTable } from '../components/customers-table'
import { CustomersToolbar } from '../components/customers-toolbar'
import { useCustomers } from '../hooks/use-customers'
import type { Customer, CustomerFilters } from '../types/customers.types'
import { customerDisplayName } from '../utils/customer-formatters'

const initialFilters: CustomerFilters = {
  search: '',
  type: 'all',
  page: 1,
  pageSize: 10,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'customers:write',
  )
  const [filters, setFilters] = useState(initialFilters)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const customers = useCustomers(queryFilters)
  const total = customers.data?.pagination.total ?? 0
  const visibleCustomers = customers.data?.data ?? []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Catálogo de clientes
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registra personas naturales o jurídicas y consulta su ficha
            completa.
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => {
              setEditingCustomer(null)
              setFormOpen(true)
            }}
          >
            <Plus size={17} /> Registrar cliente
          </Button>
        )}
      </header>

      <ModuleMetrics
        items={[
          {
            label: total === 1 ? 'Cliente encontrado' : 'Clientes encontrados',
            value: total,
          },
          {
            label: 'Personas jurídicas en esta página',
            value: visibleCustomers.filter(
              (customer) => customer.type === 'LEGAL',
            ).length,
            tone: 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de clientes"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <CustomersToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleCustomers.map((customer) => ({
            value: customer.documentNumber,
            label: `${customerDisplayName(customer)} · ${customer.documentNumber}`,
            searchTerms: [
              customer.documentNumber,
              customer.phone,
              customerDisplayName(customer),
            ],
          }))}
        />
      </section>

      <section
        aria-label="Resultados de clientes"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        {customers.isError ? (
          <ErrorState
            title="No se pudo cargar los clientes"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={customers.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void customers.refetch(),
            }}
          />
        ) : (
          <CustomersTable
            customers={visibleCustomers}
            loading={customers.isPending || customers.isFetching}
            canWrite={canWrite}
            onOpenDetail={setDetailCustomer}
            onEdit={(customer) => {
              setEditingCustomer(customer)
              setFormOpen(true)
            }}
          />
        )}

        {customers.data && customers.data.pagination.totalPages > 1 && (
          <Pagination
            page={filters.page}
            totalPages={customers.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>

      <CustomerFormModal
        open={formOpen}
        customer={editingCustomer}
        onClose={() => setFormOpen(false)}
      />
      {detailCustomer && (
        <CustomerDetailModal
          open
          customer={detailCustomer}
          canWrite={canWrite}
          onClose={() => setDetailCustomer(null)}
          onEdit={(customer) => {
            setDetailCustomer(null)
            setEditingCustomer(customer)
            setFormOpen(true)
          }}
        />
      )}
    </div>
  )
}
