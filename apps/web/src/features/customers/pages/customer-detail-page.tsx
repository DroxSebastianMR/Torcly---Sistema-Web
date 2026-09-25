import { useState } from 'react'
import { ArrowLeft, Building2, Car, History, Pencil } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { paths } from '@/app/router/constants/paths'
import { CustomerFormModal } from '../components/customer-form-modal'
import { useCustomer } from '../hooks/use-customers'
import type { Customer } from '../types/customers.types'
import {
  customerDisplayName,
  customerInitials,
  customerTypeLabel,
  dateFormatter,
  documentLabel,
} from '../utils/customer-formatters'

export default function Page() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'customers:write',
  )
  const customer = useCustomer(id ?? '')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  if (customer.isPending) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="flex animate-pulse items-center gap-4">
          <div className="size-16 rounded-2xl bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-56 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (customer.isError || !customer.data) {
    return (
      <ErrorState
        title="No se pudo cargar la ficha del cliente"
        description="Verifica que exista un cliente con este identificador e inténtalo nuevamente."
        busy={customer.isFetching}
        action={{
          label: 'Reintentar',
          onClick: () => void customer.refetch(),
        }}
      />
    )
  }

  const details = customer.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate(paths.customers)}>
          <ArrowLeft size={16} /> Volver a clientes
        </Button>
        {canWrite && (
          <Button
            onClick={() => {
              setEditingCustomer(details)
              setFormOpen(true)
            }}
          >
            <Pencil size={16} /> Editar cliente
          </Button>
        )}
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-[0_10px_35px_rgba(16,44,37,0.04)] sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/8 text-lg font-bold text-primary">
          {customerInitials(details)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight text-brand-forest">
              {customerDisplayName(details)}
            </h1>
            <TypeBadge type={details.type} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {documentLabel(details.type)} {details.documentNumber}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <header className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
            Datos de contacto
          </h2>
        </header>
        <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
          <Datum label="Documento" value={details.documentNumber} />
          <Datum label="Tipo" value={customerTypeLabel(details.type)} />
          <Datum label="Teléfono" value={details.phone} />
          <Datum label="Correo" value={details.email ?? '—'} />
          <Datum label="Registrado" value={dateFormatter(details.createdAt)} />
          <Datum
            label="Última actualización"
            value={dateFormatter(details.updatedAt)}
          />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <Car size={16} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
              Vehículos del cliente
            </h2>
          </header>
          <EmptyState
            icon={Car}
            title="Todavía no hay vehículos"
            description="Cuando se asocie una unidad, verás aquí la placa, marca y modelo del vehículo."
          />
        </section>
        <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
          <header className="flex items-center gap-2 border-b px-5 py-4">
            <History size={16} className="text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-forest">
              Historial del cliente
            </h2>
          </header>
          <EmptyState
            icon={History}
            title="Historial en blanco"
            description="Las ventas e intervenciones de taller aparecerán aquí con fecha y detalle."
          />
        </section>
      </div>

      <CustomerFormModal
        open={formOpen}
        customer={editingCustomer}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function TypeBadge({ type }: { type: Customer['type'] }) {
  const isLegal = type === 'LEGAL'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/80 px-2 py-1 text-xs font-semibold">
      {isLegal ? <Building2 size={13} className="text-primary" /> : null}
      {customerTypeLabel(type)}
    </span>
  )
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}
