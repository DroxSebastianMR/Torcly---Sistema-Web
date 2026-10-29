import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function parseMonth(value: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}

export function MonthPicker({
  value,
  onChange,
  placeholder = 'Seleccionar período',
  disabled = false,
  className,
  'aria-label': ariaLabel = 'Seleccionar período',
}: MonthPickerProps) {
  const selected = parseMonth(value)
  const current = new Date()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(selected?.year ?? current.getFullYear())
  const wrapperRef = useRef<HTMLDivElement>(null)
  const label = useMemo(
    () =>
      selected
        ? `${months[selected.month - 1]} de ${selected.year}`
        : placeholder,
    [placeholder, selected],
  )

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const selectMonth = (month: number) => {
    onChange(`${year}-${String(month).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setYear(selected?.year ?? current.getFullYear())
          setOpen((currentOpen) => !currentOpen)
        }}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[10px] border border-input bg-card px-[13px] text-left text-sm transition-colors hover:bg-background focus-visible:border-primary/70 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {label}
        </span>
        <CalendarDays
          aria-hidden
          className="size-[18px] shrink-0 text-muted-foreground"
        />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Seleccionar mes"
          className="absolute z-30 mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-[0_24px_60px_rgb(16_44_37_/_18%)]"
        >
          <div className="flex min-h-9 items-center justify-between text-brand-forest">
            <button
              type="button"
              aria-label="Año anterior"
              onClick={() => setYear((currentYear) => currentYear - 1)}
              className="grid size-[34px] place-items-center rounded-lg text-primary hover:bg-muted"
            >
              <ChevronLeft className="size-[18px]" />
            </button>
            <strong className="font-heading text-[15px]">{year}</strong>
            <button
              type="button"
              aria-label="Año siguiente"
              onClick={() => setYear((currentYear) => currentYear + 1)}
              className="grid size-[34px] place-items-center rounded-lg text-primary hover:bg-muted"
            >
              <ChevronRight className="size-[18px]" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 py-2.5">
            {months.map((month, index) => {
              const isSelected =
                selected?.year === year && selected.month === index + 1
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => selectMonth(index + 1)}
                  className={cn(
                    'min-h-9 rounded-lg text-[13px] transition-colors hover:bg-muted hover:text-primary',
                    isSelected &&
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  )}
                >
                  {month.slice(0, 3)}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between border-t pt-2 text-xs font-medium text-primary">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(
                  `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
                )
                setOpen(false)
              }}
            >
              Este mes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
