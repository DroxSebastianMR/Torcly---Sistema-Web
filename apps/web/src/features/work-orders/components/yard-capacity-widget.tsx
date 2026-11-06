import { AlertTriangle, CheckCircle2, Warehouse } from 'lucide-react'
import { useYardCapacity } from '../hooks/use-work-orders'

interface YardCapacityWidgetProps {
  className?: string
  isFilteringToday?: boolean
  onSelectTodayEntries?: () => void
}

export function YardCapacityWidget({
  className = '',
  isFilteringToday = false,
  onSelectTodayEntries,
}: YardCapacityWidgetProps) {
  const { data: capacity, isLoading } = useYardCapacity()

  const maxCapacity = capacity?.maxCapacity ?? 8
  const occupiedBays = capacity?.occupiedBays ?? 0
  const availableBays = capacity?.availableBays ?? maxCapacity
  const occupancyRate = capacity?.occupancyRate ?? 0
  const isAtCapacity = capacity?.isAtCapacity ?? false
  const todayEntries = capacity?.todayEntriesCount ?? 0
  const todayWalkIns = capacity?.todayWalkInsCount ?? 0
  const todayAppointments = capacity?.todayAppointmentsCount ?? 0

  return (
    <article
      aria-label="Aforo y capacidad de patio del taller"
      className={`relative isolate overflow-hidden rounded-2xl border border-[#e2ebe6] bg-card p-4 sm:p-5 shadow-[0_8px_24px_rgb(16_44_37_/_5%)] ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isAtCapacity
                ? 'bg-rose-100 text-rose-700'
                : occupiedBays >= 6
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100/70 text-brand-forest'
            }`}
          >
            <Warehouse size={22} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aforo y Capacidad de Patio
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  isAtCapacity
                    ? 'bg-rose-100 text-rose-800'
                    : occupiedBays >= 6
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isAtCapacity ? (
                  <>
                    <AlertTriangle size={11} /> Patio lleno (8/8)
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={11} /> {availableBays} bahías
                    disponibles
                  </>
                )}
              </span>
            </div>

            <p className="mt-0.5 text-lg font-bold text-brand-forest">
              {isLoading ? (
                'Consultando patio…'
              ) : (
                <>
                  <span className="text-2xl font-extrabold tabular-nums">
                    {occupiedBays}
                  </span>{' '}
                  <span className="text-sm font-medium text-muted-foreground">
                    de {maxCapacity} bahías ocupadas ({occupancyRate}%)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Visual 8 Bays Segmented Grid */}
        <div className="flex flex-col items-end gap-1.5">
          <div
            className="flex items-center gap-1.5"
            role="meter"
            aria-label="Ocupación de bahías"
            aria-valuenow={occupiedBays}
            aria-valuemin={0}
            aria-valuemax={maxCapacity}
          >
            {Array.from({ length: maxCapacity }, (_, i) => {
              const isOccupied = i < occupiedBays
              return (
                <div
                  key={i}
                  title={`Bahía ${i + 1}: ${isOccupied ? 'Ocupada' : 'Disponible'}`}
                  className={`h-6 w-3.5 sm:w-4 rounded-md transition-all duration-300 ${
                    isOccupied
                      ? isAtCapacity
                        ? 'bg-rose-500 shadow-[0_2px_8px_rgba(239,68,68,0.35)]'
                        : occupiedBays >= 6
                          ? 'bg-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.35)]'
                          : 'bg-emerald-600 shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
                      : 'bg-muted/80 border border-muted-foreground/20'
                  }`}
                />
              )
            })}
          </div>

          {onSelectTodayEntries ? (
            <button
              type="button"
              onClick={onSelectTodayEntries}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-right text-xs transition-colors ${
                isFilteringToday
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
              title="Filtrar en la tabla los vehículos que ingresaron hoy"
            >
              <span>Ingresos de hoy:</span>{' '}
              <strong
                className={
                  isFilteringToday
                    ? 'text-white'
                    : 'text-foreground decoration-dotted'
                }
              >
                {todayEntries}
              </strong>{' '}
              <span
                className={
                  isFilteringToday
                    ? 'text-emerald-100'
                    : 'text-muted-foreground'
                }
              >
                (
                <span
                  className={
                    isFilteringToday
                      ? 'text-white font-semibold'
                      : 'text-primary font-medium'
                  }
                >
                  {todayAppointments} citas
                </span>{' '}
                ·{' '}
                <span
                  className={
                    isFilteringToday
                      ? 'text-white font-semibold'
                      : 'text-emerald-700 font-medium'
                  }
                >
                  {todayWalkIns} directos
                </span>
                )
              </span>
            </button>
          ) : (
            <div className="text-right text-xs text-muted-foreground">
              Ingresos de hoy:{' '}
              <strong className="text-foreground">{todayEntries}</strong> (
              <span className="text-primary font-medium">
                {todayAppointments} citas
              </span>{' '}
              ·{' '}
              <span className="text-emerald-700 font-medium">
                {todayWalkIns} directos
              </span>
              )
            </div>
          )}
        </div>
      </div>

      {isAtCapacity && (
        <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <span>
            <strong>Capacidad máxima física alcanzada (8/8 vehículos):</strong>{' '}
            El patio y las bahías se encuentran completos. Considera coordinar
            entregas de órdenes listas antes de ingresar nuevos vehículos.
          </span>
        </div>
      )}
    </article>
  )
}
