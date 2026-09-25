import {
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Power,
  Wrench,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import type { Service } from '../types/services.types'
import { currencyFormatter } from '../utils/service-formatters'

interface ServicesTableProps {
  services: Service[]
  loading: boolean
  canWrite: boolean
  onEdit?: (service: Service) => void
  onToggleStatus?: (service: Service) => void
}

export function ServicesTable({
  services,
  loading,
  canWrite,
  onEdit,
  onToggleStatus,
}: ServicesTableProps) {
  if (loading) return <ServicesSkeleton />

  if (!services.length) {
    return (
      <EmptyState
        icon={Wrench}
        title="No se encontraron servicios"
        description="Ajusta los filtros o registra el primer servicio del catálogo."
      />
    )
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8faf9] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Servicio</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 text-right">Tarifa</th>
              <th className="px-4 py-3">Estado</th>
              {canWrite && (
                <th className="w-16 px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map((service) => (
              <tr key={service.id} className="group hover:bg-[#f9fbfa]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-xs font-bold text-primary">
                      <Wrench size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="max-w-64 truncate font-semibold text-foreground">
                        {service.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {service.code}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="max-w-xs px-4 py-4">
                  <p className="truncate text-muted-foreground">
                    {service.description ?? 'Sin descripción'}
                  </p>
                </td>
                <td className="px-4 py-4 text-right font-semibold tabular-nums">
                  {currencyFormatter.format(service.price)}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge active={service.active} />
                </td>
                {canWrite && (
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        title="Editar servicio"
                        aria-label={`Editar ${service.name}`}
                        onClick={() => onEdit?.(service)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title={
                          service.active
                            ? 'Desactivar servicio'
                            : 'Activar servicio'
                        }
                        aria-label={`${service.active ? 'Desactivar' : 'Activar'} ${service.name}`}
                        onClick={() => onToggleStatus?.(service)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y md:hidden">
        {services.map((service) => (
          <article key={service.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="max-w-full truncate font-semibold">
                  {service.name}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {service.code}
                </p>
              </div>
              <StatusBadge active={service.active} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Tarifa</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {currencyFormatter.format(service.price)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descripción</p>
                <p className="mt-1 line-clamp-2 text-muted-foreground">
                  {service.description ?? '—'}
                </p>
              </div>
            </div>
            {canWrite && (
              <div className="mt-4 flex gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => onEdit?.(service)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium"
                >
                  <Pencil size={15} /> Editar
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus?.(service)}
                  className="flex size-10 items-center justify-center rounded-lg border"
                  aria-label={`${service.active ? 'Desactivar' : 'Activar'} ${service.name}`}
                >
                  <Power size={16} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {!active && <AlertCircle aria-hidden size={12} />}
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function ServicesSkeleton() {
  return (
    <div className="divide-y" aria-label="Cargando servicios">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center gap-4 px-5 py-5"
        >
          <div className="size-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-2.5 w-28 rounded bg-muted" />
          </div>
          <div className="hidden h-3 w-28 rounded bg-muted sm:block" />
          <MoreHorizontal className="text-muted" />
        </div>
      ))}
    </div>
  )
}
