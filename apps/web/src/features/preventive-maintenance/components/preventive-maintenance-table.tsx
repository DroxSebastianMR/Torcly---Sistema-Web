import { useState } from 'react'
import { Copy, Check, MessageSquare, Phone, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import type { PreventiveMaintenanceItem } from '../types/preventive-maintenance.types'

interface PreventiveMaintenanceTableProps {
  items: PreventiveMaintenanceItem[]
  isLoading?: boolean
}

export function PreventiveMaintenanceTable({
  items,
  isLoading,
}: PreventiveMaintenanceTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (item: PreventiveMaintenanceItem) => {
    navigator.clipboard.writeText(item.suggestedMessage)
    setCopiedId(item.vehicleId)
    toast.success('Mensaje copiado al portapapeles.')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleOpenWhatsApp = (item: PreventiveMaintenanceItem) => {
    if (!item.customer.phone) {
      toast.error('Este cliente no tiene un teléfono registrado.')
      return
    }
    const cleanPhone = item.customer.phone.replace(/\D/g, '')
    const phoneWithCountry = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(
      item.suggestedMessage,
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-5" aria-label="Cargando recordatorios">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No se encontraron alertas preventivas"
        description="No hay vehículos que coincidan con los filtros seleccionados o todos los vehículos están al día."
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-[#e9f2ed] text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <tr>
            <th className="px-5 py-4">Vehículo</th>
            <th className="px-5 py-4">Propietario</th>
            <th className="px-5 py-4">Última Atención</th>
            <th className="px-5 py-4">Servicio Recomendado</th>
            <th className="px-5 py-4">Prioridad</th>
            <th className="px-5 py-4 text-right">Acción Comercial</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => (
            <tr key={item.vehicleId} className="bg-card hover:bg-muted/30 transition-colors">
              <td className="px-5 py-4">
                <p className="font-semibold text-brand-forest">
                  {item.plate}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.brand} {item.model} ({item.year})
                </p>
                {item.lastMileage !== null && (
                  <p className="text-[11px] font-mono text-muted-foreground/80">
                    {item.lastMileage.toLocaleString()} km
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                <p className="font-medium text-foreground">
                  {item.customer.name}
                </p>
                {item.customer.phone ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="size-3 text-muted-foreground" />
                    {item.customer.phone}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-amber-600 italic">
                    Sin teléfono
                  </p>
                )}
              </td>
              <td className="px-5 py-4">
                {item.lastServiceDate ? (
                  <>
                    <p className="font-medium text-foreground">
                      Hace {item.daysSinceLastService} días
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.lastOrderCode ? `Orden ${item.lastOrderCode}` : 'Atención previa'}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Sin atenciones previas
                  </p>
                )}
              </td>
              <td className="px-5 py-4 max-w-[240px]">
                <div className="flex items-start gap-1.5">
                  <Wrench className="size-3.5 mt-0.5 shrink-0 text-primary" />
                  <p className="text-xs font-medium text-foreground leading-snug">
                    {item.recommendedService}
                  </p>
                </div>
              </td>
              <td className="px-5 py-4">
                {item.priority === 'CRITICAL' ? (
                  <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                    Vencido ({item.daysSinceLastService}d)
                  </span>
                ) : item.priority === 'WARNING' ? (
                  <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    Por Vencer ({item.daysSinceLastService}d)
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    Al día
                  </span>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(item)}
                    title="Copiar plantilla de mensaje"
                    className="size-8 p-0"
                  >
                    {copiedId === item.vehicleId ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!item.customer.phone}
                    onClick={() => handleOpenWhatsApp(item)}
                    className="border-emerald-500 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-950 font-semibold"
                    title={
                      item.customer.phone
                        ? 'Enviar recordatorio por WhatsApp'
                        : 'Cliente sin teléfono registrado'
                    }
                  >
                    <MessageSquare className="size-3.5 text-emerald-600 fill-emerald-600" />
                    WhatsApp
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
