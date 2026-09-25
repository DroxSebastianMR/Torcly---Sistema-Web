import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Scale,
  X,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { InventoryMovement, MovementType } from '../types/inventory.types'
import {
  formatDateTime,
  formatMovementQuantity,
  formatMovementType,
} from '../utils/inventory-formatters'

interface MovementsTableProps {
  movements: InventoryMovement[]
  loading: boolean
}

const typeIcon: Record<MovementType, LucideIcon> = {
  INITIAL: History,
  ENTRY: ArrowDownToLine,
  EXIT: ArrowUpFromLine,
  ADJUSTMENT_IN: Scale,
  ADJUSTMENT_OUT: Scale,
}

const typeTone: Record<MovementType, string> = {
  INITIAL: 'bg-indigo-50 text-indigo-700',
  ENTRY: 'bg-emerald-50 text-emerald-700',
  EXIT: 'bg-amber-50 text-amber-700',
  ADJUSTMENT_IN: 'bg-sky-50 text-sky-700',
  ADJUSTMENT_OUT: 'bg-rose-50 text-rose-700',
}

export function MovementsTable({ movements, loading }: MovementsTableProps) {
  if (loading) return <MovementsSkeleton />

  if (!movements.length) {
    return (
      <EmptyState
        icon={History}
        title="Sin movimientos registrados"
        description="Los movimientos de existencias aparecerán aquí a medida que se registren."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Movimiento</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3">Registrado por</th>
              <th className="px-4 py-3">Fecha y hora</th>
              <th className="px-4 py-3">Referencia</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {movements.map((movement) => (
              <tr key={movement.id} className="hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${typeTone[movement.type]}`}
                  >
                    <TypeIcon type={movement.type} />
                    {formatMovementType(movement.type)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-56 truncate font-semibold">
                    {movement.product.name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {movement.product.code}
                  </p>
                </td>
                <td
                  className={`px-4 py-4 text-right font-semibold tabular-nums ${
                    movement.type === 'EXIT' ||
                    movement.type === 'ADJUSTMENT_OUT'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {formatMovementQuantity(movement.type, movement.quantity)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    {movement.product.unit.symbol}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {movement.performedBy}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {formatDateTime(movement.occurredAt)}
                </td>
                <td className="px-4 py-4 text-muted-foreground">
                  {movement.referenceId ? (
                    <span className="inline-flex items-center gap-1.5">
                      {movement.referenceId}
                      {movement.referenceType ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {movement.referenceType}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y lg:hidden">
        {movements.map((movement) => (
          <article key={movement.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="max-w-full truncate font-semibold">
                  {movement.product.name}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {movement.product.code}
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${typeTone[movement.type]}`}
              >
                <TypeIcon type={movement.type} />
                {formatMovementType(movement.type)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cantidad</p>
                <p
                  className={`mt-1 font-semibold tabular-nums ${
                    movement.type === 'EXIT' ||
                    movement.type === 'ADJUSTMENT_OUT'
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {formatMovementQuantity(movement.type, movement.quantity)}{' '}
                  {movement.product.unit.symbol}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Registrado por</p>
                <p className="mt-1 font-medium">{movement.performedBy}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Fecha y hora</p>
                <p className="mt-1 font-medium">
                  {formatDateTime(movement.occurredAt)}
                </p>
              </div>
              {movement.referenceId && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Referencia</p>
                  <p className="mt-1 font-medium">{movement.referenceId}</p>
                </div>
              )}
              {movement.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {movement.notes}
                  </p>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

function TypeIcon({ type }: { type: MovementType }) {
  const Icon = typeIcon[type]
  return <Icon aria-hidden className="size-3" />
}

function MovementsSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando movimientos">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-8 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-24 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-24 rounded bg-muted sm:block" />
          <X className="text-muted" />
        </div>
      ))}
    </div>
  )
}
