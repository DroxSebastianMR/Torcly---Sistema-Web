import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SmartSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SmartSelectProps {
  options: readonly SmartSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  searchThreshold?: number
  forceSearch?: boolean
  allowCustomValue?: boolean
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  'aria-label'?: string
}

const controlClass =
  'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm transition-colors hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50'

export function SmartSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  searchPlaceholder = 'Buscar opción…',
  emptyMessage = 'Sin opciones.',
  searchThreshold = 10,
  forceSearch = false,
  allowCustomValue = false,
  disabled = false,
  name,
  id,
  className,
  'aria-label': ariaLabel,
}: SmartSelectProps) {
  const listId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const showsSearchInput = forceSearch || options.length > searchThreshold
  const selected = options.find((option) => option.value === value)
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    if (!normalizedQuery) return options
    return options.filter((option) =>
      option.label.toLocaleLowerCase('es').includes(normalizedQuery),
    )
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => {
    if (open && showsSearchInput)
      requestAnimationFrame(() => searchRef.current?.focus())
  }, [open, showsSearchInput])

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
        aria-controls={listId}
        className={controlClass}
        onClick={() => {
          setOpen((current) => !current)
          setQuery(showsSearchInput ? (selected?.label ?? value) : '')
        }}
        onKeyDown={(event) => {
          if (
            event.key === 'ArrowDown' ||
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span
          className={
            selected
              ? 'truncate text-foreground'
              : 'truncate text-muted-foreground'
          }
        >
          {selected?.label ?? (value || placeholder)}
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
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-card p-2 shadow-[0_18px_40px_rgba(7,28,22,0.16)]">
          {showsSearchInput && (
            <div className="relative mb-2">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  if (allowCustomValue) onChange(event.target.value)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setOpen(false)
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-input bg-background py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filteredOptions.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-45"
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <Check
                        aria-hidden
                        className="size-4 shrink-0 text-primary"
                      />
                    )}
                  </button>
                </li>
              )
            })}
            {!filteredOptions.length && (
              <li className="px-3 py-2 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
