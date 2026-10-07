import { useDeferredValue, useState } from 'react'
import { Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
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
            <Banknote size={15} /> Caja
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

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="grid grid-cols-1 gap-3 border-b px-4 py-4 sm:grid-cols-3 sm:px-5">
          <SummaryChip
            label="Ventas pendientes de pago"
            value={
              summary
                ? String(summary.pendingCount)
                : payments.isPending
                  ? '…'
                  : '0'
            }
          />
          <SummaryChip
            label="Saldo pendiente"
            value={
              summary ? currencyFormatter.format(summary.pendingAmount) : '…'
            }
            tone="amber"
          />
          <SummaryChip
            label="Cobrado en el período"
            value={
              summary ? currencyFormatter.format(summary.collectedAmount) : '…'
            }
            tone="emerald"
          />
        </div>

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

        {payments.data && payments.data.pagination.totalPages > 1 && (
          <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
            <span className="text-muted-foreground">
              Página {filters.page} de {payments.data.pagination.totalPages}
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
                disabled={filters.page >= payments.data.pagination.totalPages}
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

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'amber' | 'emerald'
}) {
  const toneClass =
    tone === 'amber'
      ? 'text-amber-600'
      : tone === 'emerald'
        ? 'text-emerald-700'
        : 'text-brand-forest'
  return (
    <div className="rounded-xl bg-muted/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  )
}
