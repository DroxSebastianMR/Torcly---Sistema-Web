import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { Vehicle } from '../types/vehicles.types'
import { vehicleOwnerDisplay } from '../utils/vehicle-formatters'
import { dateFormatter } from '@/features/customers/utils/customer-formatters'

interface VehicleDetailModalProps {
  open: boolean
  vehicle: Vehicle | null
  canWrite: boolean
  onClose: () => void
  onEdit: (vehicle: Vehicle) => void
}

export function VehicleDetailModal({
  open,
  vehicle,
  canWrite,
  onClose,
  onEdit,
}: VehicleDetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle?.plate ?? 'Ficha del vehículo'}
      description={
        vehicle
          ? `${vehicle.brand} ${vehicle.model} · ${vehicle.year}`
          : 'Consulta los datos registrados del vehículo.'
      }
      className="max-w-2xl"
      footer={
        vehicle && canWrite ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" onClick={() => onEdit(vehicle)}>
              <Pencil size={16} /> Editar vehículo
            </Button>
          </div>
        ) : undefined
      }
    >
      {vehicle && (
        <dl className="grid overflow-hidden rounded-2xl border border-[#dce9e2] sm:grid-cols-2">
          <Datum label="Placa" value={vehicle.plate} mono />
          <Datum label="Año" value={String(vehicle.year)} />
          <Datum label="Marca" value={vehicle.brand} />
          <Datum label="Modelo" value={vehicle.model} />
          <Datum
            label="Propietario"
            value={vehicleOwnerDisplay(vehicle.owner)}
            full
          />
          <Datum label="Registrado" value={dateFormatter(vehicle.createdAt)} />
          <Datum
            label="Última actualización"
            value={dateFormatter(vehicle.updatedAt)}
          />
        </dl>
      )}
    </Modal>
  )
}

function Datum({
  label,
  value,
  mono = false,
  full = false,
}: {
  label: string
  value: string
  mono?: boolean
  full?: boolean
}) {
  return (
    <div
      className={`border-b border-[#e4ede8] px-4 py-3.5 sm:px-5 ${
        full ? 'sm:col-span-2' : ''
      }`}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1.5 text-[15px] font-bold leading-6 text-foreground ${
          mono ? 'font-mono tracking-tight' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
