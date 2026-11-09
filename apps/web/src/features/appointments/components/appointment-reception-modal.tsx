import { useState } from 'react'
import { Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import type { Appointment } from '../types/appointments.types'
import { receptionFuelLevelOptions } from '@/features/work-orders/forms/direct-work-order.schema'
import type {
  FuelLevel,
  ReceptionChecklist,
  ReceptionFuelLevel,
} from '@/features/work-orders/types/work-orders.types'

interface AppointmentReceptionModalProps {
  open: boolean
  appointment: Appointment | null
  isBusy: boolean
  onClose: () => void
  onConfirm: (data: {
    currentMileage?: number | null
    fuelLevel?: FuelLevel | null
    receptionNotes?: string | null
    receptionChecklist?: ReceptionChecklist
  }) => void
}

export function AppointmentReceptionModal({
  open,
  appointment,
  isBusy,
  onClose,
  onConfirm,
}: AppointmentReceptionModalProps) {
  const [currentMileage, setCurrentMileage] = useState<string>('')
  const [fuelLevel, setFuelLevel] = useState<ReceptionFuelLevel>('1/2')
  const [receptionNotes, setReceptionNotes] = useState<string>('')
  const [hasSpareTire, setHasSpareTire] = useState(false)
  const [hasJackAndTools, setHasJackAndTools] = useState(false)
  const [hasVehicleDocuments, setHasVehicleDocuments] = useState(false)
  const [hasRadioFaceplate, setHasRadioFaceplate] = useState(false)
  const [externalDamageNotes, setExternalDamageNotes] = useState('')
  const [photoUrls, setPhotoUrls] = useState('')

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      currentMileage: currentMileage ? Number(currentMileage) : null,
      fuelLevel: {
        E: 'EMPTY',
        '1/4': 'QUARTER',
        '1/2': 'HALF',
        '3/4': 'THREE_QUARTERS',
        F: 'FULL',
      }[fuelLevel] as FuelLevel,
      receptionNotes: receptionNotes.trim() || null,
      receptionChecklist: {
        fuelLevel,
        hasSpareTire,
        hasJackAndTools,
        hasVehicleDocuments,
        hasRadioFaceplate,
        externalDamageNotes: externalDamageNotes.trim() || null,
        photos: photoUrls
          .split(/\r?\n|,/)
          .map((url) => url.trim())
          .filter(Boolean),
      },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Atender cita y recepcionar vehículo"
      description={
        appointment
          ? `Cita ${appointment.code} · ${appointment.customer?.name ?? 'Cliente'} (${appointment.vehicle ? `${appointment.vehicle.plate} - ${appointment.vehicle.brand} ${appointment.vehicle.model}` : 'Vehículo'})`
          : 'Registra los datos de recepción del vehículo en patio.'
      }
      className="max-w-lg"
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="receptionMileage"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Gauge size={14} className="text-muted-foreground" />
              Kilometraje actual (km)
            </label>
            <Input
              id="receptionMileage"
              type="number"
              min={0}
              placeholder="Ej. 65000"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="receptionFuelLevel" className="text-sm font-medium">
              Combustible al recibir
            </label>
            <SmartSelect
              id="receptionFuelLevel"
              placeholder="Nivel de tanque…"
              options={receptionFuelLevelOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={fuelLevel}
              onChange={(val) => setFuelLevel(val as ReceptionFuelLevel)}
            />
          </div>
        </div>

        <fieldset className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
          <legend className="px-1 text-sm font-semibold">Peritaje de recepción</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['Llanta de repuesto', hasSpareTire, setHasSpareTire],
              ['Gata y herramientas', hasJackAndTools, setHasJackAndTools],
              ['Documentos del vehículo', hasVehicleDocuments, setHasVehicleDocuments],
              ['Panel de radio', hasRadioFaceplate, setHasRadioFaceplate],
            ].map(([label, checked, onChange]) => (
              <label key={label as string} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-brand-forest"
                  checked={checked as boolean}
                  onChange={(event) => (onChange as (value: boolean) => void)(event.target.checked)}
                />
                {label as string}
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="externalDamageNotes" className="text-sm font-medium">Daños externos observados</label>
            <textarea id="externalDamageNotes" rows={2} maxLength={1000} placeholder="Rayones, golpes u observaciones visibles…" className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none no-scrollbar focus:ring-2 focus:ring-ring" value={externalDamageNotes} onChange={(event) => setExternalDamageNotes(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="photoUrls" className="text-sm font-medium">Fotos (URLs, una por línea)</label>
            <textarea id="photoUrls" rows={2} placeholder="https://…" className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none no-scrollbar focus:ring-2 focus:ring-ring" value={photoUrls} onChange={(event) => setPhotoUrls(event.target.value)} />
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="receptionNotes" className="text-sm font-medium">
            Observaciones de recepción (opcional)
          </label>
          <textarea
            id="receptionNotes"
            rows={3}
            placeholder="Observaciones de carrocería, pertenencias o condición de entrega…"
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none no-scrollbar focus:ring-2 focus:ring-ring"
            value={receptionNotes}
            onChange={(e) => setReceptionNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isBusy} aria-busy={isBusy}>
            {isBusy ? 'Creando orden…' : 'Crear orden de taller'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
