import { Banknote, CreditCard, Landmark, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CashSession } from '../types/cash-session.types'
import {
  currencyFormatter,
  dateTimeFormatter,
} from '../utils/payment-formatters'

interface CashSessionOverviewProps {
  session: CashSession | null | undefined
  loading: boolean
  canWrite: boolean
  onOpen: () => void
  onClose: () => void
}

export function CashSessionOverview({
  session,
  loading,
  canWrite,
  onOpen,
  onClose,
}: CashSessionOverviewProps) {
  if (loading) {
    return (
      <div
        aria-label="Cargando caja actual"
        className="h-44 animate-pulse rounded-2xl border bg-muted/50"
      />
    )
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-dashed bg-card p-5 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-forest">
            No hay una caja abierta
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Abre la caja antes de registrar pagos o compensaciones.
          </p>
        </div>
        {canWrite && (
          <Button className="mt-4 sm:mt-0" onClick={onOpen}>
            <Landmark aria-hidden className="size-4" />
            Abrir caja
          </Button>
        )}
      </section>
    )
  }

  const methods = [
    {
      label: 'Efectivo esperado',
      value: session.totals.expectedCashAmount,
      icon: Banknote,
    },
    { label: 'Tarjeta', value: session.totals.net.card, icon: CreditCard },
    {
      label: 'Transferencia',
      value: session.totals.net.transfer,
      icon: Landmark,
    },
    {
      label: 'Billetera digital',
      value: session.totals.net.digitalWallet,
      icon: WalletCards,
    },
  ]

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-[0_10px_28px_rgb(16_44_37_/_5%)]">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-brand-forest">
              Caja actual · {session.code}
            </p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Abierta
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Abierta por {session.openedBy} ·{' '}
            {dateTimeFormatter.format(new Date(session.openedAt))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            El efectivo esperado incluye el monto inicial y solo los cobros y
            compensaciones en efectivo de esta caja.
          </p>
        </div>
        {canWrite && (
          <Button variant="outline" onClick={onClose}>
            Cerrar caja
          </Button>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {methods.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-muted/55 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon aria-hidden className="size-4 text-primary" />
              {label}
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-brand-forest">
              {currencyFormatter.format(value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
