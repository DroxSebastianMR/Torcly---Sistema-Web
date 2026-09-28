import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  interval?: number
  placeholder?: string
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  'aria-label'?: string
}

function buildTimes(interval: number) {
  return Array.from(
    { length: Math.floor((24 * 60) / interval) },
    (_, index) => {
      const minutes = index * interval
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    },
  )
}

export function TimePicker({
  value,
  onChange,
  interval = 30,
  placeholder = 'Seleccionar hora',
  disabled = false,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const times = useMemo(() => buildTimes(Math.max(1, interval)), [interval])

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
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-3 rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
        onClick={() => setOpen((current) => !current)}
      >
        <Clock3 aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn('flex-1', !value && 'text-muted-foreground')}>
          {value || placeholder}
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
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border/80 bg-card p-2 shadow-[0_18px_40px_rgba(7,28,22,0.16)]"
        >
          {times.map((time) => {
            const selected = time === value
            return (
              <li key={time}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => {
                    onChange(time)
                    setOpen(false)
                  }}
                >
                  <span>{time}</span>
                  {selected && (
                    <Check aria-hidden className="size-4 text-primary" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
