import type { ReactNode } from 'react'
import { ArrowRight, LoaderCircle, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isForbidden } from '../utils/report-formatters'

interface BlockCardProps {
  title: string
  icon: ReactNode
  criteria?: string
  source?: string
  periodField?: string
  periodLabel: string
  isPending: boolean
  isFetching: boolean
  isError: boolean
  error?: unknown
  hasData: boolean
  refetch: () => void
  modulePath: string
  moduleLabel: string
  children: ReactNode
}

export function BlockCard({
  title,
  icon,
  criteria,
  source,
  periodField,
  periodLabel,
  isPending,
  isFetching,
  isError,
  error,
  hasData,
  refetch,
  modulePath,
  moduleLabel,
  children,
}: BlockCardProps) {
  const pending = isPending && !hasData
  const forbidden = isError && isForbidden(error)

  return (
    <section className="rounded-2xl border bg-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-lg font-bold text-brand-forest">{title}</h2>
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
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {moduleLabel} <ArrowRight size={15} />
        </Link>
      </header>

      {pending ? (
        <p
          role="status"
          aria-label={`Cargando ${title}`}
          className="py-10 text-center text-sm text-muted-foreground"
        >
          Cargando {title}…
        </p>
      ) : forbidden ? (
        <div
          role="alert"
          className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center"
        >
          <p className="font-semibold text-foreground">Sección restringida</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            No tienes permiso para consultar este bloque; los datos restringidos
            no se muestran.
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

      {(criteria || source || periodField) && (
        <footer
          className={cn(
            'mt-4 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs leading-5 text-muted-foreground',
            pending && 'opacity-0',
          )}
        >
          {criteria && <p>{criteria}</p>}
          {(source || periodField) && (
            <p className="mt-1">
              {source && <span>Fuente: {source}.</span>}{' '}
              {periodField && <span>Período: {periodField}.</span>}
            </p>
          )}
        </footer>
      )}
    </section>
  )
}
