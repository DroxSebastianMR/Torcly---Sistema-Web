import { Modal } from '@/components/ui/modal'
import { useCashSession } from '../hooks/use-cash-sessions'
import {
  currencyFormatter,
  dateTimeFormatter,
} from '../utils/payment-formatters'

interface CashSessionDetailModalProps {
  id: string | null
  open: boolean
  onClose: () => void
}

const methodRows = [
  { key: 'cash', label: 'Efectivo' },
  { key: 'card', label: 'Tarjeta' },
  { key: 'transfer', label: 'Transferencia' },
  { key: 'digitalWallet', label: 'Billetera digital (Yape/Plin)' },
] as const

export function CashSessionDetailModal({
  id,
  open,
  onClose,
}: CashSessionDetailModalProps) {
  const query = useCashSession(id ?? '')
  const session = query.data

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={session ? `${session.code} · Caja cerrada` : 'Detalle de caja'}
      description="Resumen inmutable de la apertura, movimientos y cierre del período."
      className="max-w-3xl"
    >
      {query.isPending ? (
        <div aria-label="Cargando detalle de caja" className="space-y-4">
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : session ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Efectivo esperado"
              value={session.expectedCashAmount ?? 0}
            />
            <SummaryCard
              label="Efectivo contado"
              value={session.countedCashAmount ?? 0}
            />
            <SummaryCard
              label="Diferencia"
              value={session.differenceAmount ?? 0}
              tone={
                (session.differenceAmount ?? 0) === 0 ? 'success' : 'warning'
              }
            />
          </section>

          <section className="rounded-xl border">
            <SectionTitle>Apertura</SectionTitle>
            <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
              <DetailField
                label="Monto inicial"
                value={currencyFormatter.format(session.openingAmount)}
              />
              <DetailField label="Abierta por" value={session.openedBy} />
              <DetailField
                label="Fecha de apertura"
                value={dateTimeFormatter.format(new Date(session.openedAt))}
              />
              <DetailField
                label="Observación"
                value={session.openingNotes || 'Sin observación'}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border">
            <SectionTitle>Movimientos registrados</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f]">
                  <tr>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3 text-right">Cobros</th>
                    <th className="px-4 py-3 text-right">Compensaciones</th>
                    <th className="px-4 py-3 text-right">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {methodRows.map(({ key, label }) => (
                    <tr key={key}>
                      <td className="px-4 py-3 font-medium">{label}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {currencyFormatter.format(session.totals.payments[key])}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {currencyFormatter.format(
                          session.totals.compensations[key],
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {currencyFormatter.format(session.totals.net[key])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border">
            <SectionTitle>Cierre</SectionTitle>
            <div className="grid gap-4 p-4 text-sm sm:grid-cols-2">
              <DetailField
                label="Cerrada por"
                value={session.closedBy ?? '—'}
              />
              <DetailField
                label="Fecha de cierre"
                value={
                  session.closedAt
                    ? dateTimeFormatter.format(new Date(session.closedAt))
                    : '—'
                }
              />
              <DetailField
                className="sm:col-span-2"
                label="Observación de cierre"
                value={session.closingNotes || 'Sin observación'}
              />
            </div>
          </section>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No se encontró el detalle de esta caja.
        </p>
      )}
    </Modal>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="border-b bg-muted/45 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'success' | 'warning'
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : 'text-brand-forest'
  return (
    <div className="rounded-xl bg-muted/55 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-lg font-semibold tabular-nums ${toneClass}`}>
        {currencyFormatter.format(value)}
      </p>
    </div>
  )
}
