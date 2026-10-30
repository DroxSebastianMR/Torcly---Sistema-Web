import { createPortal } from 'react-dom'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
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
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => parse(value.from) ?? new Date())
  const [panelStyle, setPanelStyle] = useState<CSSProperties>()
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

  const updatePanelPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const viewportPadding = 12
    const gap = 8
    const width = Math.min(544, window.innerWidth - viewportPadding * 2)
    const left = Math.max(
      viewportPadding,
      Math.min(rect.left, window.innerWidth - width - viewportPadding),
    )
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openAbove = spaceBelow < 360 && spaceAbove > spaceBelow

    setPanelStyle({
      left,
      width,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !wrapperRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  useEffect(() => {
    if (!open) return
    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
    }
  }, [open, updatePanelPosition])
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
        ref={buttonRef}
        onClick={() => {
          setMonth(parse(value.from) ?? new Date())
          if (!open) updatePanelPosition()
          setOpen((current) => !current)
        }}
        className="flex min-h-11 w-full items-center gap-3 rounded-[10px] border border-input bg-card px-[13px] text-left text-sm transition-[border-color,background-color] duration-150 ease-out hover:bg-background focus-visible:border-primary/70 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
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
      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Seleccionar rango de fechas"
            style={panelStyle}
            className="fixed z-[60] rounded-2xl border border-border bg-card p-3 shadow-[0_24px_60px_rgb(16_44_37_/_18%)] sm:flex sm:gap-4"
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
                  className="rounded-lg p-2 text-primary hover:bg-muted"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <strong className="font-heading capitalize text-[15px] text-brand-forest">
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
                  className="rounded-lg p-2 text-primary hover:bg-muted"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((day) => (
                  <span
                    key={day}
                    className="py-1 text-xs text-muted-foreground"
                  >
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
                        'mx-auto flex size-9 items-center justify-center rounded-[9px] text-sm hover:bg-muted hover:text-primary',
                        between && 'rounded-[9px] bg-primary/10 text-primary',
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
                  [15, 'Últimos 15 días'],
                  [30, 'Últimos 30 días'],
                  ['month', 'Este mes'],
                ].map(([amount, text]) => (
                  <button
                    key={String(amount)}
                    type="button"
                    onClick={() => preset(amount as number | 'month')}
                    className="min-h-9 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted hover:text-primary"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
