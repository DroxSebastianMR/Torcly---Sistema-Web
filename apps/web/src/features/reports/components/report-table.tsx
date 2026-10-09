import { cn } from '@/lib/utils'

export interface ReportTableColumn<TRow> {
  key: string
  header: string
  cell: (row: TRow) => React.ReactNode
  align?: 'left' | 'right'
}

interface ReportTableProps<TRow> {
  caption: string
  rows: TRow[]
  columns: ReportTableColumn<TRow>[]
  emptyMessage?: string
}

export function ReportTable<TRow>({
  caption,
  rows,
  columns,
  emptyMessage = 'Sin registros en el período.',
}: ReportTableProps<TRow>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="text-left text-sm font-semibold text-brand-forest">
          {caption}
        </caption>
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'py-1.5 pr-2 font-medium',
                  column.align === 'right' && 'text-right',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b text-muted-foreground">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'py-1.5 pr-2 align-top',
                    column.align === 'right' && 'text-right tabular-nums',
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
