import { HandCoins, Receipt, Undo2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { PaymentDetail, PaymentEvent } from '../types/payment.types'
import {
  currencyFormatter,
  dateTimeFormatter,
  paymentCollectionStatusLabel,
  paymentMethodLabel,
} from '../utils/payment-formatters'

interface PaymentDetailModalProps {
  open: boolean
  detail: PaymentDetail | null
  loading: boolean
  canCompensate: boolean
  onClose: () => void
  onCompensate: (event: PaymentEvent) => void
}

export function PaymentDetailModal({
  open,
  detail,
  loading,
  canCompensate,
  onClose,
  onCompensate,
}: PaymentDetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={detail?.code ?? 'Detalle de cobro'}
      description={
        detail
          ? `Cobro ${paymentCollectionStatusLabel(
              detail.collectionStatus,
            ).toLowerCase()}`
          : undefined
      }
      className="max-w-2xl"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {loading || !detail ? (
        <DetailSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCell label="Total" value={detail.total} emphasis />
            <SummaryCell label="Cobrado" value={detail.paid} />
            <SummaryCell label="Saldo" value={detail.balance} paid />
            <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado
              </p>
              <p
                className={`text-sm font-bold ${
                  detail.collectionStatus === 'PAID'
                    ? 'text-emerald-700'
                    : detail.collectionStatus === 'PARTIALLY_PAID'
                      ? 'text-sky-700'
                      : 'text-amber-700'
                }`}
              >
                {paymentCollectionStatusLabel(detail.collectionStatus)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoItem
              icon={<UserRound aria-hidden size={15} />}
              label="Cliente"
              value={
                detail.customer
                  ? `${detail.customer.name} · ${detail.customer.documentNumber}`
                  : 'Venta sin cliente'
              }
            />
            <InfoItem
              icon={<Receipt aria-hidden size={15} />}
              label="Confirmada"
              value={dateTimeFormatter.format(new Date(detail.confirmedAt))}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-brand-forest">
              Historial de pagos
            </h3>
            {detail.events.length === 0 ? (
              <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                Aún no hay pagos registrados para esta venta.
              </p>
            ) : (
              <ol className="space-y-3">
                {detail.events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    canCompensate={canCompensate}
                    onCompensate={() => onCompensate(event)}
                  />
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function SummaryCell({
  label,
  value,
  paid = false,
  emphasis = false,
}: {
  label: string
  value: number
  paid?: boolean
  emphasis?: boolean
}) {
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3 text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-sm font-bold tabular-nums ${
          paid ? 'text-emerald-700' : emphasis ? 'text-brand-forest' : ''
        }`}
      >
        {currencyFormatter.format(value)}
      </p>
    </div>
  )
}

function EventRow({
  event,
  canCompensate,
  onCompensate,
}: {
  event: PaymentEvent
  canCompensate: boolean
  onCompensate: () => void
}) {
  const compensation = event.type === 'COMPENSATION'
  return (
    <li
      className={`rounded-xl border p-4 ${
        compensation ? 'border-red-100 bg-red-50/40' : 'border-border bg-card'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                compensation
                  ? 'bg-red-100 text-red-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {compensation ? (
                <Undo2 aria-hidden size={15} />
              ) : (
                <HandCoins aria-hidden size={15} />
              )}
            </span>
            <div>
              <p className="font-mono text-sm font-semibold">{event.code}</p>
              <p className="text-xs text-muted-foreground">
                {event.type === 'PAYMENT' ? 'Pago' : 'Compensación'} ·{' '}
                {paymentMethodLabel[event.method]} ·{' '}
                {dateTimeFormatter.format(new Date(event.occurredAt))}
              </p>
            </div>
          </div>
          {event.reason && (
            <p className="mt-2 text-sm text-muted-foreground">
              Motivo: <span className="font-medium">{event.reason}</span>
            </p>
          )}
          {event.notes && (
            <p className="mt-1 text-xs text-muted-foreground">{event.notes}</p>
          )}
          {event.originalCode && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Pago original: {event.originalCode}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <p
            className={`font-semibold tabular-nums ${
              compensation ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {compensation ? '-' : '+'}
            {currencyFormatter.format(event.amount)}
          </p>
          <p className="text-xs text-muted-foreground">{event.performedBy}</p>
          {!compensation && canCompensate && (
            <Button type="button" variant="outline" onClick={onCompensate}>
              <Undo2 size={14} /> Compensar
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-label="Cargando cobro">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
