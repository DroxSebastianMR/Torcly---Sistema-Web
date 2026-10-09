import { CalendarRange, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { Period } from '../types/reports.types'
import { defaultPeriod } from '../utils/report-formatters'

interface PeriodToolbarProps {
  value: Period
  onChange: (value: Period) => void
}

export function PeriodToolbar({ value, onChange }: PeriodToolbarProps) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
      <CalendarRange aria-hidden className="size-5 text-muted-foreground" />
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
        className="gap-2"
      >
        <RotateCcw className="size-4" aria-hidden />
        Últimos 30 días
      </Button>
    </section>
  )
}
