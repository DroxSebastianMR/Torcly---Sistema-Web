import {
  Building2,
  Eye,
  MoreHorizontal,
  Pencil,
  UsersRound,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { TableActionButton } from '@/components/ui/table-action-button'
import type { Customer } from '../types/customers.types'
import {
  customerDisplayName,
  customerInitials,
  customerTypeLabel,
  dateFormatter,
  documentLabel,
} from '../utils/customer-formatters'

interface CustomersTableProps {
  customers: Customer[]
  loading: boolean
  canWrite: boolean
  onOpenDetail: (customer: Customer) => void
  onEdit: (customer: Customer) => void
}

export function CustomersTable({
  customers,
  loading,
  canWrite,
  onOpenDetail,
  onEdit,
}: CustomersTableProps) {
  if (loading) return <CustomersSkeleton />

  if (!customers.length) {
    return (
      <EmptyState
        icon={UsersRound}
        title="No se encontraron clientes"
        description="Ajusta los filtros o registra el primer cliente del catálogo."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
            <tr>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Registro</th>
              <th className="w-24 px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="group hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-xs font-bold text-primary">
                      {customerInitials(customer)}
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(customer)}
                        className="block max-w-72 truncate text-left font-semibold text-foreground hover:text-primary"
                      >
                        {customerDisplayName(customer)}
                      </button>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {documentLabel(customer.type)} {customer.documentNumber}
                        {customer.email ? ` · ${customer.email}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <TypeBadge type={customer.type} />
                </td>
                <td className="px-4 py-4 font-mono tabular-nums text-muted-foreground">
                  {customer.documentNumber}
                </td>
                <td className="px-4 py-4 tabular-nums text-muted-foreground">
                  {customer.phone}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {dateFormatter(customer.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                    <TableActionButton
                      label={`Ver ficha de ${customerDisplayName(customer)}`}
                      title="Ver ficha"
                      onClick={() => onOpenDetail(customer)}
                    >
                      <Eye size={16} />
                    </TableActionButton>
                    <TableActionButton
                      label={`Editar ${customerDisplayName(customer)}`}
                      title="Editar datos"
                      onClick={() => onEdit(customer)}
                      disabled={!canWrite}
                    >
                      <Pencil size={16} />
                    </TableActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {customers.map((customer) => (
          <article key={customer.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {customerDisplayName(customer)}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {documentLabel(customer.type)} {customer.documentNumber}
                </p>
              </div>
              <TypeBadge type={customer.type} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Teléfono" value={customer.phone} />
              <Info
                label="Registro"
                value={dateFormatter(customer.createdAt)}
              />
            </div>
            <div className="mt-4 flex gap-2 border-t pt-3">
              <TableActionButton
                onClick={() => onOpenDetail(customer)}
                label={`Ver ficha de ${customerDisplayName(customer)}`}
                title="Ver ficha"
                className="h-10 flex-1 gap-2 px-3 text-sm font-medium"
              >
                <Eye aria-hidden size={15} /> Ver ficha
              </TableActionButton>
              {canWrite && (
                <TableActionButton
                  onClick={() => onEdit(customer)}
                  label={`Editar ${customerDisplayName(customer)}`}
                  title="Editar datos"
                >
                  <Pencil size={16} />
                </TableActionButton>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function TypeBadge({ type }: { type: Customer['type'] }) {
  const isNatural = type === 'NATURAL'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/80 px-2 py-1 text-xs font-semibold">
      {isNatural ? (
        <UsersRound size={13} className="text-primary" />
      ) : (
        <Building2 size={13} className="text-primary" />
      )}
      {customerTypeLabel(type)}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}

function CustomersSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando clientes">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-28 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
