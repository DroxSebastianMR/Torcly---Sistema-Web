import { useDeferredValue, useState } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { PaymentsToolbar } from '../components/payments-toolbar'
import { PaymentsTable } from '../components/payments-table'
import { PaymentDetailModal } from '../components/payment-detail-modal'
import { PaymentFormModal } from '../components/payment-form-modal'
import { CompensationFormModal } from '../components/compensation-form-modal'
import { usePayment, usePayments } from '../hooks/use-payments'
import type {
  PaymentEvent,
  PaymentFilters,
  PaymentObligationSummary,
} from '../types/payment.types'
import { currencyFormatter } from '../utils/payment-formatters'

const initialFilters: PaymentFilters = {
  search: '',
  status: 'all',
  method: 'all',
  from: null,
  to: null,
  page: 1,
  pageSize: 20,
}

export default function Page() {
  const { user: currentUser } = useAuth()
  const permissions = currentUser?.permissions ?? []
  const canCollect =
    hasPermission(permissions, 'cash:write') &&
    hasPermission(permissions, 'sales:write')
  const [filters, setFilters] = useState(initialFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collectTarget, setCollectTarget] =
    useState<PaymentObligationSummary | null>(null)
  const [compensationEvent, setCompensationEvent] =
    useState<PaymentEvent | null>(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const payments = usePayments(queryFilters)
  const detail = usePayment(selectedId ?? '')

  const visibleObligations = payments.data?.data ?? []
  const summary = payments.data?.summary

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Caja
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Cobros
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registra los pagos de ventas confirmadas, consulta saldos pendientes
            y corrige cobros mediante compensaciones auditadas.
          </p>
        </div>
      </header>

      <ModuleMetrics
        items={[
          {
            label: 'Ventas pendientes de pago',
            value: summary
              ? String(summary.pendingCount)
              : payments.isPending
                ? '…'
                : '0',
          },
          {
            label: 'Saldo pendiente',
            value: summary
              ? currencyFormatter.format(summary.pendingAmount)
              : '…',
            tone: 'warning',
          },
          {
            label: 'Cobrado en el período',
            value: summary
              ? currencyFormatter.format(summary.collectedAmount)
              : '…',
            tone: 'success',
          },
        ]}
      />

      <section
        aria-label="Filtros de cobros"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <PaymentsToolbar
          filters={filters}
          onChange={setFilters}
          suggestions={visibleObligations.map((obligation) => ({
            value: obligation.code,
            label: `${obligation.code} · ${
              obligation.customer?.name ?? 'Sin cliente'
            }`,
            searchTerms: [
              obligation.code,
              obligation.customer?.name ?? '',
              obligation.customer?.documentNumber ?? '',
            ],
          }))}
        />
      </section>

      <section
        aria-label="Resultados de cobros"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        {payments.isError ? (
          <ErrorState
            title="No se pudo cargar los cobros"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={payments.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void payments.refetch(),
            }}
          />
        ) : (
          <PaymentsTable
            obligations={visibleObligations}
            loading={payments.isPending}
            canCollect={canCollect}
            onOpen={(obligation) => setSelectedId(obligation.id)}
            onCollect={(obligation) => setCollectTarget(obligation)}
          />
        )}

        {payments.data && (
          <Pagination
            page={filters.page}
            totalPages={payments.data.pagination.totalPages}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
          />
        )}
      </section>

      <PaymentDetailModal
        open={Boolean(selectedId)}
        detail={detail.data ?? null}
        loading={detail.isPending}
        canCompensate={canCollect}
        onClose={() => setSelectedId(null)}
        onCompensate={(event) => setCompensationEvent(event)}
      />
      <PaymentFormModal
        open={Boolean(collectTarget)}
        obligation={collectTarget}
        onClose={() => setCollectTarget(null)}
      />
      <CompensationFormModal
        open={Boolean(compensationEvent)}
        event={compensationEvent}
        onClose={() => setCompensationEvent(null)}
      />
    </div>
  )
}
