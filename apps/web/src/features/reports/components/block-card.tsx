import type { ReactNode } from 'react'
import { ArrowUpRight, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isForbidden } from '../utils/report-formatters'

interface BlockCardProps {
  title: string
  icon?: ReactNode
  criteria?: string
  periodLabel: string
  isPending: boolean
  isFetching: boolean
  isError: boolean
  error?: unknown
  hasData: boolean
  refetch: () => void
  modulePath: string
  children: ReactNode
}

export function BlockCard({
  title,
  icon,
  criteria,
  periodLabel,
  isPending,
  isFetching,
  isError,
  error,
  hasData,
  refetch,
  modulePath,
  children,
}: BlockCardProps) {
  const pending = isPending && !hasData
  const forbidden = isError && isForbidden(error)

  return (
    <section className="overflow-hidden rounded-[22px] border border-border/80 bg-card shadow-[0_14px_30px_rgb(16_44_37_/_5%)]">
      <header className="flex items-start justify-between gap-3 border-b border-border/70 bg-[linear-gradient(135deg,rgba(234,242,238,.72),rgba(255,255,255,.9))] px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span aria-hidden>{icon}</span>}
            <h2 className="text-lg font-bold tracking-tight text-brand-forest">
              {title}
            </h2>
            {isFetching && !isError && (
              <LoaderCircle
                aria-hidden
                className="size-4 text-muted-foreground motion-safe:animate-spin"
              />
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Período aplicado: {periodLabel}
          </p>
        </div>
        <Link
          to={modulePath}
          className="mt-2 inline-flex items-center gap-1.5 self-center text-sm font-semibold text-primary hover:underline"
        >
          Ver más <ArrowUpRight size={15} />
        </Link>
      </header>

      <div className="p-5 sm:p-6">
        {pending ? (
          <div
            role="status"
            aria-label={`Cargando ${title}`}
            className="space-y-4 py-4"
          >
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-44 animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        ) : forbidden ? (
          <div
            role="alert"
            className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center"
          >
            <p className="font-semibold text-foreground">Sección restringida</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No tienes permiso para consultar este bloque; los datos
              restringidos no se muestran.
            </p>
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center"
          >
            <TriangleAlert aria-hidden className="size-6 text-destructive" />
            <p className="max-w-sm text-sm text-muted-foreground">
              No se pudo cargar {title}.
            </p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          children
        )}

        {criteria && (
          <footer
            className={cn(
              'mt-5 border-t border-border/70 pt-4 text-xs leading-5 text-muted-foreground',
              pending && 'opacity-0',
            )}
          >
            <p>{criteria}</p>
          </footer>
        )}
      </div>
    </section>
  )
}
