import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ComponentProps } from 'react'

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

function visiblePages(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1])

  return [...pages]
    .filter((target) => target >= 1 && target <= totalPages)
    .sort((left, right) => left - right)
}

/** Navegación consistente para todas las tablas paginadas de Torcly. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <footer
      className={`flex flex-col gap-3 border-t border-[#dce7e1] px-4 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className ?? ''}`}
      aria-label="Paginación"
    >
      <p className="font-medium text-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <PaginationButton
          label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={17} aria-hidden />
        </PaginationButton>
        {visiblePages(page, totalPages).map((target, index, pages) => (
          <div key={target} className="flex items-center gap-2">
            {index > 0 && target - pages[index - 1]! > 1 && (
              <span className="px-0.5 text-muted-foreground">…</span>
            )}
            <PaginationButton
              label={`Ir a página ${target}`}
              active={target === page}
              onClick={() => onPageChange(target)}
            >
              {target}
            </PaginationButton>
          </div>
        ))}
        <PaginationButton
          label="Página siguiente"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={17} aria-hidden />
        </PaginationButton>
      </div>
    </footer>
  )
}

function PaginationButton({
  active = false,
  children,
  label,
  ...props
}: ComponentProps<'button'> & { active?: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={`flex size-9 items-center justify-center rounded-xl border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_4px_12px_rgb(23_99_76_/_20%)]'
          : 'border-border bg-card text-primary hover:border-primary hover:bg-primary/5'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
