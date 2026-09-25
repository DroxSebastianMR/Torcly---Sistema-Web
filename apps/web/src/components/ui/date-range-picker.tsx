import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from: string
  to: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parse = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : null
}
const display = (value: string) => {
  const date = parse(value)
  return date
    ? new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    : ''
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Seleccionar periodo',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: DateRangePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => parse(value.from) ?? new Date())
  const label = value.from
    ? `${display(value.from)}${value.to ? ` — ${display(value.to)}` : ''}`
    : placeholder
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-PE', {
        month: 'long',
        year: 'numeric',
      }).format(month),
    [month],
  )

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  const choose = (date: Date) => {
    const picked = iso(date)
    if (!value.from || value.to) {
      onChange({ from: picked, to: '' })
      return
    }
    onChange(
      value.from <= picked
        ? { from: value.from, to: picked }
        : { from: picked, to: value.from },
    )
  }
  const preset = (daysBack: number | 'month') => {
    const today = new Date()
    const from =
      daysBack === 'month'
        ? new Date(today.getFullYear(), today.getMonth(), 1)
        : new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - daysBack + 1,
          )
    onChange({ from: iso(from), to: iso(today) })
    setMonth(from)
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
          setMonth(parse(value.from) ?? new Date())
          setOpen((current) => !current)
        }}
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-input bg-background px-3 text-left text-sm hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
        <span
          className={cn(
            'flex-1 truncate',
            !value.from && 'text-muted-foreground',
          )}
        >
          {label}
        </span>
        <ChevronDown
          aria-hidden
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Seleccionar rango de fechas"
          className="absolute z-30 mt-2 w-[min(34rem,calc(100vw-2rem))] rounded-xl border border-border/80 bg-card p-4 shadow-[0_18px_40px_rgba(7,28,22,0.16)] sm:flex sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() =>
                  setMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1,
                      ),
                  )
                }
                className="rounded-lg p-2 hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
              </button>
              <strong className="capitalize text-sm text-brand-forest">
                {monthLabel}
              </strong>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() =>
                  setMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1,
                      ),
                  )
                }
                className="rounded-lg p-2 hover:bg-muted"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((day) => (
                <span key={day} className="py-1 text-xs text-muted-foreground">
                  {day}
                </span>
              ))}
              {Array.from({ length: offset }).map((_, index) => (
                <span key={index} />
              ))}
              {Array.from({ length: days }, (_, index) => {
                const date = new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  index + 1,
                )
                const key = iso(date)
                const selected = key === value.from || key === value.to
                const between =
                  value.from && value.to && key > value.from && key < value.to
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={Boolean(selected)}
                    onClick={() => choose(date)}
                    className={cn(
                      'mx-auto flex size-9 items-center justify-center rounded-full text-sm hover:bg-primary/10',
                      between && 'rounded-none bg-primary/10 text-primary',
                      selected &&
                        'bg-primary text-primary-foreground hover:bg-primary',
                    )}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-4 border-t pt-3 sm:mt-0 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Periodos rápidos
            </p>
            <div className="grid gap-1">
              {[
                [7, 'Últimos 7 días'],
                [14, 'Últimos 14 días'],
                [31, 'Últimos 31 días'],
                ['month', 'Este mes'],
              ].map(([amount, text]) => (
                <button
                  key={String(amount)}
                  type="button"
                  onClick={() => preset(amount as number | 'month')}
                  className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted hover:text-primary"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
