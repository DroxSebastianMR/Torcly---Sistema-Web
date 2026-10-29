import { useDeferredValue, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardMinus,
  History,
  ListChecks,
  PlusCircle,
  Scale,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { ModuleMetrics } from '@/components/ui/module-metrics'
import { Pagination } from '@/components/ui/pagination'
import { useAuth } from '@/features/auth/hooks/auth-context'
import { hasPermission } from '@/lib/permissions'
import { ExistenceTable } from '../components/existence-table'
import { InventoryToolbar } from '../components/inventory-toolbar'
import { MovementFormModal } from '../components/movement-form-modal'
import { MovementsTable } from '../components/movements-table'
import {
  useExistence,
  useInventoryProductOptions,
  useMovements,
} from '../hooks/use-inventory'
import type {
  InventoryFilters,
  MovementFilters,
  MovementFormKind,
} from '../types/inventory.types'
import { numberFormatter } from '../utils/inventory-formatters'
import type { SmartSelectOption } from '@/components/ui/smart-select'

type InventoryView = 'existence' | 'movements'

const initialExistenceFilters: InventoryFilters = {
  search: '',
  page: 1,
  pageSize: 10,
}

const initialMovementFilters: MovementFilters = {
  productId: '',
  type: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 10,
}

const movementActions: Array<{
  kind: MovementFormKind
  label: string
  icon: typeof PlusCircle
}> = [
  { kind: 'INITIAL', label: 'Stock inicial', icon: ClipboardMinus },
  { kind: 'ENTRY', label: 'Entrada', icon: ArrowDownToLine },
  { kind: 'EXIT', label: 'Salida', icon: ArrowUpFromLine },
  { kind: 'ADJUSTMENT', label: 'Ajuste', icon: Scale },
]

export default function Page() {
  const { user: currentUser } = useAuth()
  const canWrite = hasPermission(
    currentUser?.permissions ?? [],
    'inventory:write',
  )
  const [view, setView] = useState<InventoryView>('existence')
  const [existenceFilters, setExistenceFilters] = useState<InventoryFilters>(
    initialExistenceFilters,
  )
  const [movementFilters, setMovementFilters] = useState<MovementFilters>(
    initialMovementFilters,
  )
  const [dialogKind, setDialogKind] = useState<MovementFormKind | null>(null)
  const deferredSearch = useDeferredValue(existenceFilters.search)
  const existenceQuery = useExistence(
    {
      ...existenceFilters,
      search: deferredSearch,
    },
    view === 'existence',
  )
  const productOptions = useInventoryProductOptions(view === 'movements')
  const movements = useMovements(movementFilters, view === 'movements')
  const items = existenceQuery.data?.data ?? []
  const suggestions = items.map((item) => ({
    value: item.code,
    label: `${item.name} · ${item.code}`,
  })) as readonly SmartSelectOption[]
  const totalProducts = existenceQuery.data?.pagination.total ?? 0
  const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
  const lowStockCount = items.filter((item) => item.lowStock).length

  const showPagination = (data?: { pagination: { totalPages: number } }) =>
    data && data.pagination.totalPages > 1

  const openDialog = (kind: MovementFormKind) => {
    if (!canWrite) {
      toast.error('No tienes permiso para registrar movimientos.')
      return
    }
    setDialogKind(kind)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[33rem]">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Almacén y kardex
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Inventario
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
            Consulta el stock disponible, detecta alertas de stock bajo y
            registra movimientos con trazabilidad completa.
          </p>
        </div>
        {canWrite && (
          <div className="flex shrink-0 gap-2">
            {movementActions.map(({ kind, label, icon: Icon }) => (
              <Button
                key={kind}
                variant={kind === 'INITIAL' ? 'default' : 'outline'}
                onClick={() => openDialog(kind)}
                className="whitespace-nowrap px-3 sm:px-4"
              >
                <Icon size={16} /> {label}
              </Button>
            ))}
          </div>
        )}
      </header>

      <ModuleMetrics
        items={
          view === 'existence'
            ? [
                { label: 'Productos con existencias', value: totalProducts },
                {
                  label: 'Unidades disponibles',
                  value: numberFormatter.format(totalStock),
                  valueLabel: 'en esta página',
                },
                {
                  label: 'Stock bajo',
                  value: lowStockCount,
                  valueLabel: 'en esta página',
                  tone: 'warning',
                },
              ]
            : [
                {
                  label: 'Movimientos encontrados',
                  value: movements.data?.pagination.total ?? 0,
                },
              ]
        }
      />

      <section
        aria-label="Filtros de inventario"
        className="rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div
            role="tablist"
            aria-label="Secciones de inventario"
            className="flex self-end rounded-xl bg-muted p-1 xl:order-2 xl:ml-auto xl:self-auto"
          >
            {(
              [
                ['existence', 'Existencias'],
                ['movements', 'Historial'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                onClick={() => setView(value)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {value === 'movements' ? (
                  <History size={15} />
                ) : (
                  <ListChecks size={15} />
                )}
                {label}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <InventoryToolbar
              view={view}
              existenceFilters={existenceFilters}
              movementFilters={movementFilters}
              products={productOptions.data ?? []}
              existenceSuggestions={suggestions}
              onExistenceChange={(filters) => {
                setExistenceFilters(filters)
                setView('existence')
              }}
              onMovementsChange={(filters) => {
                setMovementFilters(filters)
                setView('movements')
              }}
            />
          </div>
        </div>
      </section>

      <section
        aria-label="Resultados de inventario"
        className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]"
      >
        {view === 'existence' ? (
          existenceQuery.isError ? (
            <ErrorState
              title="No se pudieron cargar las existencias"
              description="Verifica la conexión con la API e inténtalo nuevamente."
              busy={existenceQuery.isFetching}
              action={{
                label: 'Reintentar',
                onClick: () => void existenceQuery.refetch(),
              }}
            />
          ) : (
            <ExistenceTable
              items={items}
              loading={existenceQuery.isPending || existenceQuery.isFetching}
            />
          )
        ) : movements.isError ? (
          <ErrorState
            title="No se pudo cargar el historial"
            description="Verifica la conexión con la API e inténtalo nuevamente."
            busy={movements.isFetching}
            action={{
              label: 'Reintentar',
              onClick: () => void movements.refetch(),
            }}
          />
        ) : (
          <MovementsTable
            movements={movements.data?.data ?? []}
            loading={movements.isPending || movements.isFetching}
          />
        )}

        {showPagination(
          view === 'existence' ? existenceQuery.data : movements.data,
        ) &&
          (view === 'existence' ? (
            <Pagination
              page={existenceFilters.page}
              totalPages={existenceQuery.data?.pagination.totalPages ?? 1}
              onPageChange={(page) =>
                setExistenceFilters((current) => ({ ...current, page }))
              }
            />
          ) : movements.data ? (
            <Pagination
              page={movementFilters.page}
              totalPages={movements.data.pagination.totalPages}
              onPageChange={(page) =>
                setMovementFilters((current) => ({ ...current, page }))
              }
            />
          ) : null)}
      </section>

      <MovementFormModal
        open={Boolean(dialogKind)}
        kind={dialogKind ?? 'ENTRY'}
        onClose={() => setDialogKind(null)}
      />
    </div>
  )
}
