import { useDeferredValue, useState } from 'react'
import { toast } from 'sonner'
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
import { CashSessionFormModal } from '../components/cash-session-form-modal'
import { CashSessionDetailModal } from '../components/cash-session-detail-modal'
import { CashSessionHistory } from '../components/cash-session-history'
import { CashSessionOverview } from '../components/cash-session-overview'
import {
  useCashSessions,
  useCurrentCashSession,
} from '../hooks/use-cash-sessions'
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
  pageSize: 10,
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
  const [compensationTarget, setCompensationTarget] = useState<{
    event: PaymentEvent
    remainingAmount: number
  } | null>(null)
  const [cashSessionModal, setCashSessionModal] = useState<
    'open' | 'close' | null
  >(null)
  const [historyPage, setHistoryPage] = useState(1)
  const [selectedCashSessionId, setSelectedCashSessionId] = useState<
    string | null
  >(null)
  const deferredSearch = useDeferredValue(filters.search)
  const queryFilters = { ...filters, search: deferredSearch }
  const payments = usePayments(queryFilters)
  const detail = usePayment(selectedId ?? '')
  const currentCashSession = useCurrentCashSession()
  const cashSessionHistory = useCashSessions({
    page: historyPage,
    pageSize: 10,
  })

  const visibleObligations = payments.data?.data ?? []
  const summary = payments.data?.summary
  const hasOpenCashSession = Boolean(currentCashSession.data)
  const canRegisterPayment = canCollect && hasOpenCashSession

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

      {currentCashSession.isError ? (
        <ErrorState
          title="No se pudo consultar la caja actual"
          description="Verifica la conexión e inténtalo nuevamente antes de registrar cobros."
          action={{
            label: 'Reintentar',
            onClick: () => void currentCashSession.refetch(),
          }}
        />
      ) : (
        <CashSessionOverview
          session={currentCashSession.data}
          loading={currentCashSession.isPending}
          canWrite={hasPermission(permissions, 'cash:write')}
          onOpen={() => setCashSessionModal('open')}
          onClose={() => setCashSessionModal('close')}
        />
      )}

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
            loading={payments.isFetching}
            canCollect={canCollect}
            onOpen={(obligation) => setSelectedId(obligation.id)}
            onCollect={(obligation) => {
              if (!hasOpenCashSession) {
                toast.error('Abre una caja antes de registrar un cobro.')
                setCashSessionModal('open')
                return
              }
              setCollectTarget(obligation)
            }}
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
        canCompensate={canRegisterPayment}
        onClose={() => setSelectedId(null)}
        onCompensate={(event, remainingAmount) =>
          setCompensationTarget({ event, remainingAmount })
        }
      />
      <PaymentFormModal
        open={Boolean(collectTarget)}
        obligation={collectTarget}
        onClose={() => setCollectTarget(null)}
      />
      <CompensationFormModal
        open={Boolean(compensationTarget)}
        event={compensationTarget?.event ?? null}
        remainingAmount={compensationTarget?.remainingAmount}
        onClose={() => setCompensationTarget(null)}
      />
      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-brand-forest">
            Historial de cierres
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta los arqueos realizados en períodos anteriores.
          </p>
        </div>
        {cashSessionHistory.isError ? (
          <ErrorState
            title="No se pudo cargar el historial de cierres"
            description="Verifica la conexión e inténtalo nuevamente."
            action={{
              label: 'Reintentar',
              onClick: () => void cashSessionHistory.refetch(),
            }}
          />
        ) : (
          <CashSessionHistory
            response={cashSessionHistory.data}
            loading={cashSessionHistory.isPending}
            page={historyPage}
            onPageChange={setHistoryPage}
            onOpen={(session) => setSelectedCashSessionId(session.id)}
          />
        )}
      </section>
      {cashSessionModal && (
        <CashSessionFormModal
          key={`${cashSessionModal}-${currentCashSession.data?.id ?? 'new'}`}
          open
          mode={cashSessionModal}
          session={currentCashSession.data ?? null}
          onClose={() => setCashSessionModal(null)}
        />
      )}
      <CashSessionDetailModal
        open={Boolean(selectedCashSessionId)}
        id={selectedCashSessionId}
        onClose={() => setSelectedCashSessionId(null)}
      />
    </div>
  )
}
