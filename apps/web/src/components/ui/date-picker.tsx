import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  min?: string
  max?: string
  className?: string
  'aria-label'?: string
}

const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function toDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return year && month && day ? new Date(year, month - 1, day) : null
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(left: Date, right: Date) {
  return toIsoDate(left) === toIsoDate(right)
}

function isOutsideRange(date: Date, min?: string, max?: string) {
  const value = toIsoDate(date)
  return Boolean((min && value < min) || (max && value > max))
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  name,
  id,
  min,
  max,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const selectedDate = toDate(value)
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(
    () => selectedDate ?? new Date(),
  )
  const wrapperRef = useRef<HTMLDivElement>(null)
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('es-PE', {
        month: 'long',
        year: 'numeric',
      }).format(visibleMonth),
    [visibleMonth],
  )
  const formattedValue = selectedDate
    ? new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(selectedDate)
    : placeholder
  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  )
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate()

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
        onClick={() => {
          setVisibleMonth(selectedDate ?? new Date())
          setOpen((current) => !current)
        }}
      >
        <CalendarDays
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
        <span
          className={cn(
            'flex-1 truncate',
            !selectedDate && 'text-muted-foreground',
          )}
        >
          {formattedValue}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Calendario"
          className="absolute z-30 mt-2 w-[19rem] rounded-xl border border-border/80 bg-card p-4 shadow-[0_18px_40px_rgba(7,28,22,0.16)]"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Mes anterior"
              className="flex size-8 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() =>
                setVisibleMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="capitalize text-sm font-semibold text-brand-forest">
              {monthLabel}
            </p>
            <button
              type="button"
              aria-label="Mes siguiente"
              className="flex size-8 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() =>
                setVisibleMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <span
                key={day}
                className="py-1 text-xs font-medium text-muted-foreground"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: startOffset }).map((_, index) => (
              <span key={`offset-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const date = new Date(
                visibleMonth.getFullYear(),
                visibleMonth.getMonth(),
                index + 1,
              )
              const selected = selectedDate && isSameDay(date, selectedDate)
              const blocked = isOutsideRange(date, min, max)
              return (
                <button
                  key={toIsoDate(date)}
                  type="button"
                  disabled={blocked}
                  aria-pressed={Boolean(selected)}
                  className={cn(
                    'mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-30',
                    selected &&
                      'bg-primary text-primary-foreground hover:bg-primary',
                  )}
                  onClick={() => {
                    onChange(toIsoDate(date))
                    setOpen(false)
                  }}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
