import { useDeferredValue, useState } from 'react'
import { Plus, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/app/router/constants/paths'
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
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'customers:write',
  )
  const navigate = useNavigate()

  const [filters, setFilters] = useState(initialFilters)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
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
            <UsersRound size={15} /> Catálogo de clientes
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

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UsersRound size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">{total}</p>
              <p className="text-xs text-muted-foreground">
                {total === 1 ? 'cliente encontrado' : 'clientes encontrados'}
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xl font-semibold tabular-nums text-emerald-700">
              {
                visibleCustomers.filter((customer) => customer.type === 'LEGAL')
                  .length
              }
            </p>
            <p className="text-xs text-muted-foreground">
              personas jurídicas en esta página
            </p>
          </div>
          {customers.isFetching && !customers.isPending && (
            <span className="ml-auto text-xs text-muted-foreground">
              Actualizando…
            </span>
          )}
        </div>

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
            loading={customers.isPending}
            canWrite={canWrite}
            onOpenDetail={(customer) =>
              navigate(`${paths.customers}/${customer.id}`)
            }
            onEdit={(customer) => {
              setEditingCustomer(customer)
              setFormOpen(true)
            }}
          />
        )}

        {customers.data && customers.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {customers.data.pagination.totalPages}
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
                disabled={filters.page >= customers.data.pagination.totalPages}
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

      <CustomerFormModal
        open={formOpen}
        customer={editingCustomer}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
