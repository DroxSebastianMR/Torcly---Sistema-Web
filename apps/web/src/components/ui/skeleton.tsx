import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/** Bloque de carga reutilizable que conserva el espacio del contenido final. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'block animate-pulse rounded-md bg-surface-muted',
        className,
      )}
    />
  )
}

interface TableSkeletonProps {
  columns: number
  rows?: number
  className?: string
}

/** Representa la forma de una tabla sin exponer contenido ni estado vacío. */
export function TableSkeleton({
  columns,
  rows = 6,
  className,
}: TableSkeletonProps) {
  return (
    <div
      aria-label="Cargando tabla"
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card',
        className,
      )}
    >
      <div className="hidden md:block">
        <div
          className="grid gap-4 border-b border-border bg-muted/40 px-4 py-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-3 w-3/4" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid gap-4 border-b border-border px-4 py-4 last:border-0"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }, (_, column) => (
              <Skeleton
                key={column}
                className={`h-4 ${column === 0 ? 'w-4/5' : 'w-3/5'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-4 p-4 md:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-border p-4"
          >
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface ModuleListSkeletonProps {
  rows?: number
  label: string
  className?: string
}

/** Patrón de carga de filas usado por Ventas, Clientes y Citas. */
export function ModuleListSkeleton({
  rows = 6,
  label,
  className,
}: ModuleListSkeletonProps) {
  return (
    <div className={cn('divide-y', className)} aria-label={label}>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-48 max-w-[70%]" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="hidden h-3 w-28 sm:block" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function ModuleMetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Cargando indicadores"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  )
}
