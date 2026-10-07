import { HandCoins, MoreHorizontal, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { PaymentObligationSummary } from '../types/payment.types'
import {
  currencyFormatter,
  dateTimeFormatter,
  paymentCollectionStatusLabel,
} from '../utils/payment-formatters'

interface PaymentsTableProps {
  obligations: PaymentObligationSummary[]
  loading: boolean
  canCollect: boolean
  onOpen: (obligation: PaymentObligationSummary) => void
  onCollect: (obligation: PaymentObligationSummary) => void
}

export function PaymentsTable({
  obligations,
  loading,
  canCollect,
  onOpen,
  onCollect,
}: PaymentsTableProps) {
  if (loading) return <PaymentsSkeleton />

  if (!obligations.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="No se encontraron cobros"
        description="Ajusta los filtros o confirma ventas para cobrarlas."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Venta</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Cobrado</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {obligations.map((obligation) => (
              <tr
                key={obligation.id}
                className="group cursor-pointer hover:bg-[#f9fbfa]"
                onClick={() => onOpen(obligation)}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <Receipt size={17} />
                    </span>
                    <p className="font-semibold text-foreground">
                      {obligation.code}
                    </p>
                  </div>
                </td>
                <td className="max-w-48 px-4 py-4">
                  <p className="truncate">
                    {obligation.customer
                      ? obligation.customer.name
                      : 'Venta sin cliente'}
                  </p>
                  {obligation.customer && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {obligation.customer.documentNumber}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {dateTimeFormatter.format(new Date(obligation.confirmedAt))}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">
                  {currencyFormatter.format(obligation.total)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                  {currencyFormatter.format(obligation.paid)}
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums text-emerald-700">
                  {currencyFormatter.format(obligation.balance)}
                </td>
                <td className="px-4 py-4">
                  <CollectionBadge status={obligation.collectionStatus} />
                </td>
                <td
                  className="px-4 py-4 text-right"
                  onClick={(event) => event.stopPropagation()}
                >
                  {canCollect && obligation.balance > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onCollect(obligation)}
                    >
                      <HandCoins size={15} /> Cobrar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpen(obligation)}
                    >
                      Ver
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {obligations.map((obligation) => (
          <article
            key={obligation.id}
            className="px-4 py-4"
            onClick={() => onOpen(obligation)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{obligation.code}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {obligation.customer
                    ? obligation.customer.name
                    : 'Venta sin cliente'}
                </p>
              </div>
              <CollectionBadge status={obligation.collectionStatus} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {currencyFormatter.format(obligation.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cobrado</p>
                <p className="mt-1 tabular-nums">
                  {currencyFormatter.format(obligation.paid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="mt-1 font-semibold tabular-nums text-emerald-700">
                  {currencyFormatter.format(obligation.balance)}
                </p>
              </div>
            </div>
            {canCollect && obligation.balance > 0 && (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={(event) => {
                  event.stopPropagation()
                  onCollect(obligation)
                }}
              >
                <HandCoins size={15} /> Cobrar
              </Button>
            )}
          </article>
        ))}
      </div>
    </>
  )
}

function CollectionBadge({
  status,
}: {
  status: PaymentObligationSummary['collectionStatus']
}) {
  const tones: Record<PaymentObligationSummary['collectionStatus'], string> = {
    PENDING: 'bg-amber-50 text-amber-700',
    PARTIALLY_PAID: 'bg-sky-50 text-sky-700',
    PAID: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}
    >
      {paymentCollectionStatusLabel(status)}
    </span>
  )
}

function PaymentsSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando cobros">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-44 rounded bg-muted" />
            <div className="h-2.5 w-32 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
