import type { ReactNode, TableHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode
  wrapperClassName?: string
}

/**
 * Contenedor visual para los listados de escritorio.
 * Mantiene la densidad de 46 px en encabezados y 56 px en filas del UI Lab.
 */
export function DataTable({
  children,
  className,
  wrapperClassName,
  ...props
}: DataTableProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgb(16_44_37_/_6%)] dark:border-[#2b4a3d] dark:bg-surface dark:shadow-[0_8px_20px_rgb(0_0_0_/_18%)]',
        wrapperClassName,
      )}
    >
      <table
        className={cn('w-full min-w-max text-left text-sm', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}
