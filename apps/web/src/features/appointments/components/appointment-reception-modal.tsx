import { useState } from 'react'
import { Fuel, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { SmartSelect } from '@/components/ui/smart-select'
import type { Appointment } from '../types/appointments.types'
import { fuelLevelOptions } from '@/features/work-orders/forms/direct-work-order.schema'
import type { FuelLevel } from '@/features/work-orders/types/work-orders.types'

interface AppointmentReceptionModalProps {
  open: boolean
  appointment: Appointment | null
  isBusy: boolean
  onClose: () => void
  onConfirm: (data: {
    currentMileage?: number | null
    fuelLevel?: FuelLevel | null
    receptionNotes?: string | null
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
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | null>(null)
  const [receptionNotes, setReceptionNotes] = useState<string>('')

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm({
      currentMileage: currentMileage ? Number(currentMileage) : null,
      fuelLevel,
      receptionNotes: receptionNotes.trim() || null,
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
            <label
              htmlFor="receptionFuelLevel"
              className="flex items-center gap-1.5 text-sm font-medium"
            >
              <Fuel size={14} className="text-muted-foreground" />
              Nivel de combustible
            </label>
            <SmartSelect
              id="receptionFuelLevel"
              placeholder="Nivel de tanque…"
              options={fuelLevelOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={fuelLevel ?? ''}
              onChange={(val) => setFuelLevel((val || null) as FuelLevel)}
            />
          </div>
        </div>

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
