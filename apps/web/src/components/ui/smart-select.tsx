import { createPortal } from 'react-dom'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { ClearInputButton } from './clear-input-button'
import { cn } from '@/lib/utils'

export interface SmartSelectOption {
  value: string
  label: string
  meta?: string
  disabled?: boolean
  searchTerms?: readonly string[]
}

interface SmartSelectProps {
  options: readonly SmartSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  searchThreshold?: number
  menuMaxHeight?: number
  forceSearch?: boolean
  allowCustomValue?: boolean
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  filterOption?: (option: SmartSelectOption, query: string) => boolean
  onOpen?: () => void
  'aria-label'?: string
  'aria-invalid'?: boolean
}

const controlClass =
  'flex min-h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-input bg-card px-[13px] text-left text-sm transition-[border-color,background-color] duration-150 ease-out hover:bg-background focus-visible:border-primary/70 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'

export function SmartSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  searchPlaceholder = 'Buscar opción…',
  emptyMessage = 'Sin opciones.',
  searchThreshold = 10,
  menuMaxHeight = 240,
  forceSearch = false,
  allowCustomValue = false,
  disabled = false,
  name,
  id,
  className,
  filterOption,
  onOpen,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: SmartSelectProps) {
  const listId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuStyle, setMenuStyle] = useState<CSSProperties>()
  const showsSearchInput = forceSearch || options.length > searchThreshold
  const selected = options.find((option) => option.value === value)

  const updateMenuPosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const viewportPadding = 8
    const gap = 8
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
    const spaceAbove = rect.top - viewportPadding
    const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow
    const availableHeight = Math.max(
      80,
      Math.min(menuMaxHeight, openAbove ? spaceAbove : spaceBelow),
    )

    setMenuStyle({
      left: rect.left,
      width: rect.width,
      maxHeight: availableHeight,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }, [menuMaxHeight])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    if (!normalizedQuery) return options
    return options.filter((option) => {
      if (filterOption) return filterOption(option, normalizedQuery)
      return [option.label, ...(option.searchTerms ?? [])].some((term) =>
        term.toLocaleLowerCase('es').includes(normalizedQuery),
      )
    })
  }, [filterOption, options, query])

  useEffect(() => {
    if (!open) return
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [open])

  useEffect(() => {
    if (!open) return
    updateMenuPosition()
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (open && showsSearchInput)
      requestAnimationFrame(() => searchRef.current?.focus())
  }, [open, showsSearchInput])

  const openMenu = () => {
    onOpen?.()
    setQuery(showsSearchInput ? (selected?.label ?? value) : '')
    updateMenuPosition()
    setOpen(true)
  }

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }, [])

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={controlClass}
        onClick={() => {
          if (open) {
            closeMenu()
          } else {
            openMenu()
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.preventDefault()
            closeMenu()
            return
          }
          if (
            event.key === 'ArrowDown' ||
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault()
            openMenu()
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
      {open &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                closeMenu(true)
              }
            }}
            className="fixed z-[60] flex flex-col overflow-hidden rounded-[10px] border border-border bg-card p-2 shadow-[0_24px_60px_rgb(16_44_37_/_18%)]"
          >
            {showsSearchInput && (
              <div className="relative mb-2 w-full shrink-0">
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
                    if (event.key === 'Escape') closeMenu(true)
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      if (allowCustomValue) onChange(query)
                      closeMenu(true)
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-input bg-background py-2 pr-10 pl-9 text-sm outline-none focus-visible:border-primary/70"
                />
                {query && (
                  <ClearInputButton
                    onClear={() => {
                      setQuery('')
                      if (allowCustomValue) onChange('')
                    }}
                  />
                )}
              </div>
            )}
            <ul
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className="min-h-0 w-full flex-1 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                      className="flex min-h-[42px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted hover:text-primary focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-45"
                      onClick={() => {
                        onChange(option.value)
                        closeMenu(true)
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {option.meta}
                      </span>
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
          </div>,
          document.body,
        )}
    </div>
  )
}
