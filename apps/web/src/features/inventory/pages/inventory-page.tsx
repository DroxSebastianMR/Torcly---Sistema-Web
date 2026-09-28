import { useDeferredValue, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardMinus,
  History,
  ListChecks,
  PlusCircle,
  Scale,
  Warehouse,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
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
  pageSize: 20,
}

const initialMovementFilters: MovementFilters = {
  productId: '',
  type: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
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
  const existenceQuery = useExistence({
    ...existenceFilters,
    search: deferredSearch,
  })
  const productOptions = useInventoryProductOptions()
  const movements = useMovements(movementFilters)
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
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Warehouse size={15} /> Almacén y kardex
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]">
            Inventario
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consulta el stock disponible, detecta alertas de stock bajo y
            registra movimientos con trazabilidad completa.
          </p>
        </div>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            {movementActions.map(({ kind, label, icon: Icon }) => (
              <Button
                key={kind}
                variant={kind === 'INITIAL' ? 'default' : 'outline'}
                onClick={() => openDialog(kind)}
              >
                <Icon size={16} /> {label}
              </Button>
            ))}
          </div>
        )}
      </header>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-[0_10px_35px_rgba(16,44,37,0.04)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ListChecks size={17} />
            </span>
            <div>
              <p className="text-xl font-semibold tabular-nums">
                {view === 'existence'
                  ? totalProducts
                  : (movements.data?.pagination.total ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {view === 'existence'
                  ? 'productos con existencias'
                  : 'movimientos encontrados'}
              </p>
            </div>
          </div>
          {view === 'existence' && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl font-semibold tabular-nums">
                  {numberFormatter.format(totalStock)}
                </p>
                <p className="text-xs text-muted-foreground">
                  unidades en esta página
                </p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl font-semibold tabular-nums text-amber-700">
                  {lowStockCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  con stock bajo en esta página
                </p>
              </div>
            </>
          )}
          <div
            role="tablist"
            aria-label="Secciones de inventario"
            className="ml-auto flex rounded-xl bg-muted p-1"
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
        </div>

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
            <ExistenceTable items={items} loading={existenceQuery.isPending} />
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
            loading={movements.isPending}
          />
        )}

        {showPagination(
          view === 'existence' ? existenceQuery.data : movements.data,
        ) &&
          (view === 'existence' ? (
            <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
              <span className="text-muted-foreground">
                Página {existenceFilters.page} de{' '}
                {existenceQuery.data?.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={existenceFilters.page === 1}
                  onClick={() =>
                    setExistenceFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    existenceFilters.page >=
                    (existenceQuery.data?.pagination.totalPages ?? 1)
                  }
                  onClick={() =>
                    setExistenceFilters((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </footer>
          ) : movements.data ? (
            <footer className="flex items-center justify-between border-t px-4 py-4 text-sm sm:px-5">
              <span className="text-muted-foreground">
                Página {movementFilters.page} de{' '}
                {movements.data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={movementFilters.page === 1}
                  onClick={() =>
                    setMovementFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    movementFilters.page >= movements.data.pagination.totalPages
                  }
                  onClick={() =>
                    setMovementFilters((current) => ({
                      ...current,
                      page: current.page + 1,
                    }))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </footer>
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
