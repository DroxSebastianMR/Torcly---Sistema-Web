import { Search, X, ArrowUpRight } from 'lucide-react'
import { useNavigationSearch } from '../hooks/use-navigation-search'
import type { NavigationLink } from '../utils/navigation-search'

export function NavigationSearch({
  items,
}: {
  items: readonly NavigationLink[]
}) {
  const {
    dialogRef,
    triggerRef,
    inputRef,
    query,
    setQuery,
    results,
    openSearch,
    closeSearch,
    restoreFocus,
    selectResult,
  } = useNavigationSearch(items)
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openSearch}
        aria-label="Buscar módulo"
        aria-haspopup="dialog"
        className="flex h-10 items-center gap-2 rounded-xl border bg-background px-3 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Search aria-hidden="true" size={16} />
        <span className="hidden text-xs md:inline">Buscar módulo…</span>
        <kbd className="ml-6 hidden rounded border bg-card px-1.5 py-0.5 text-[10px] lg:inline">
          Ctrl K
        </kbd>
      </button>
      <dialog
        ref={dialogRef}
        onClose={restoreFocus}
        aria-labelledby="navigation-search-title"
        className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-[1.35rem] border border-border/80 bg-card p-0 text-foreground shadow-[0_24px_80px_rgba(7,28,22,0.24)] backdrop:bg-[#071c16]/55 backdrop:backdrop-blur-[2px]"
      >
        <div className="relative px-5 pt-5">
          <h2
            id="navigation-search-title"
            className="pr-12 text-sm font-semibold text-brand-forest"
          >
            Ir a un módulo
          </h2>
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Cerrar búsqueda"
            className="absolute top-4 right-5 flex size-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X size={18} />
          </button>
        </div>
        <form
          className="p-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (results[0]) selectResult(results[0].path)
          }}
        >
          <label htmlFor="module-search" className="sr-only">
            Nombre del módulo
          </label>
          <input
            ref={inputRef}
            id="module-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ventas, inventario, clientes…"
            autoComplete="off"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-primary"
          />
        </form>
        <p role="status" className="px-5 pb-2 text-xs text-muted-foreground">
          {results.length} módulos disponibles
        </p>
        <ul className="max-h-[45dvh] space-y-1 overflow-y-auto px-3 pb-3">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => selectResult(item.path)}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              >
                <item.icon
                  aria-hidden="true"
                  size={18}
                  className="text-primary"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.group}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  size={15}
                  className="text-muted-foreground"
                />
              </button>
            </li>
          ))}
        </ul>
        {!results.length && (
          <p className="px-5 pb-6 text-sm text-muted-foreground">
            No encontramos módulos. Prueba con otro nombre.
          </p>
        )}
        <div className="mt-2 bg-muted/55 px-5 py-3 text-xs text-muted-foreground">
          Tab para recorrer · Enter para abrir · Esc para cerrar
        </div>
      </dialog>
    </>
  )
}
