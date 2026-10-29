import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from './button'
import type { SmartSelectOption } from './smart-select'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: readonly SmartSelectOption[]
  value: readonly string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar opciones',
  searchPlaceholder = 'Buscar opciones…',
  emptyMessage = 'Sin opciones.',
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: MultiSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<string[]>([...value])
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    return normalized
      ? options.filter((option) =>
          option.label.toLocaleLowerCase('es').includes(normalized),
        )
      : options
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    requestAnimationFrame(() => searchRef.current?.focus())
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const toggle = (option: SmartSelectOption) => {
    if (option.disabled) return
    setDraft((current) =>
      current.includes(option.value)
        ? current.filter((item) => item !== option.value)
        : [...current, option.value],
    )
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
        onClick={() => {
          setDraft([...value])
          setQuery('')
          setOpen((current) => !current)
        }}
      >
        <span
          className={value.length ? 'text-foreground' : 'text-muted-foreground'}
        >
          {value.length ? `${value.length} seleccionados` : placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-[0_18px_40px_rgba(7,28,22,0.16)]">
          <div className="relative border-b p-3">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpen(false)
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-lg border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <ul
            role="listbox"
            aria-multiselectable="true"
            aria-label={ariaLabel}
            className="max-h-60 overflow-y-auto"
          >
            {filtered.map((option) => {
              const selected = draft.includes(option.value)
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={option.disabled}
                    onClick={() => toggle(option)}
                    className="flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left text-sm last:border-0 hover:bg-muted disabled:pointer-events-none disabled:opacity-45"
                  >
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded border',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background',
                      )}
                    >
                      {selected && <Check aria-hidden className="size-3.5" />}
                    </span>
                    <span>{option.label}</span>
                  </button>
                </li>
              )
            })}
            {!filtered.length && (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            )}
          </ul>
          <div className="flex items-center gap-3 border-t bg-muted/55 p-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Aplicar ({draft.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
