import { Download, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { Period } from '../types/reports.types'
import { defaultPeriod } from '../utils/report-formatters'

interface PeriodToolbarProps {
  value: Period
  onChange: (value: Period) => void
  onExport?: () => void
  isExporting?: boolean
}

export function PeriodToolbar({
  value,
  onChange,
  onExport,
  isExporting = false,
}: PeriodToolbarProps) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-[0_10px_28px_rgb(16_44_37_/_5%)] sm:p-5">
      <DateRangePicker
        aria-label="Filtrar reportes por período"
        value={{ from: value.from ?? '', to: value.to ?? '' }}
        onChange={(range) =>
          onChange({ from: range.from || null, to: range.to || null })
        }
        className="w-full sm:w-80"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange(defaultPeriod())}
        className="gap-2 whitespace-nowrap"
      >
        <RotateCcw className="size-4" aria-hidden />
        Últimos 30 días
      </Button>
      {onExport && (
        <Button
          type="button"
          variant="excelOutline"
          onClick={onExport}
          loading={isExporting}
          className="gap-2 whitespace-nowrap sm:ml-auto"
        >
          {!isExporting && <Download className="size-4" aria-hidden />}
          Exportar Excel
        </Button>
      )}
    </section>
  )
}
