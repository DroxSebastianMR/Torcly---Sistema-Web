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
  ranked?: boolean
}

export function ReportTable<TRow>({
  caption,
  rows,
  columns,
  emptyMessage = 'Sin registros en el período.',
  ranked = false,
}: ReportTableProps<TRow>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-base font-bold tracking-tight text-foreground">
        {caption}
      </h3>
      <div className="overflow-x-auto rounded-xl border border-border/75 bg-card dark:border-[#2b4a3d] dark:bg-[#102019]">
        <table aria-label={caption} className="w-full text-sm">
          <thead className="border-b border-[#d6e3dd] bg-[#eaf2ee] text-[11px] font-bold uppercase tracking-wider text-[#53685f] dark:border-[#365047] dark:bg-[#1d2a26] dark:text-[#aac4b8]">
            <tr className="text-left">
              {ranked && <th className="w-12 px-3 py-2.5 text-center">#</th>}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-3 py-2.5 font-bold first:pl-4 last:pr-4',
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
              <tr
                key={index}
                className="border-b border-border/65 text-foreground last:border-b-0 hover:bg-muted/50 dark:hover:bg-[#1b2924]"
              >
                {ranked && (
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs font-bold',
                        index === 0 &&
                          'bg-[#147357] text-white shadow-[0_3px_8px_rgb(20_115_87_/_28%)] dark:bg-emerald-400/20 dark:text-emerald-200 dark:shadow-none',
                        index === 1 &&
                          'bg-[#2776a6] text-white shadow-[0_3px_8px_rgb(39_118_166_/_23%)] dark:bg-sky-400/20 dark:text-sky-200 dark:shadow-none',
                        index === 2 &&
                          'bg-[#d97706] text-white shadow-[0_3px_8px_rgb(217_119_6_/_23%)] dark:bg-amber-400/20 dark:text-amber-200 dark:shadow-none',
                        index > 2 && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-2.5 align-top first:pl-4 last:pr-4',
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
    </section>
  )
}
