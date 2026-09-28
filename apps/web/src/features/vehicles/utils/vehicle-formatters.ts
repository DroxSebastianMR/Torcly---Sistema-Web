import { isAxiosError } from 'axios'
import type { Vehicle, VehicleOwner } from '../types/vehicles.types'
import type { VehicleFormValues } from '../forms/vehicles.schema'

export function getVehiclesErrorMessage(error: unknown) {
  if (isAxiosError<{ error?: { message?: string } }>(error)) {
    return (
      error.response?.data.error?.message ??
      'No se pudo completar la operación.'
    )
  }
  return 'No se pudo completar la operación.'
}

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, '').trim()
}

export function formatPlateInput(value: string) {
  return normalizePlate(value).slice(0, 12)
}

export function vehicleYearLabel(year: number) {
  return String(year)
}

export function vehicleOwnerDisplay(owner: VehicleOwner) {
  if (owner.type === 'NATURAL') {
    return [owner.firstName, owner.lastName].filter(Boolean).join(' ')
  }
  return owner.legalName ?? 'Sin razón social'
}

export function vehicleOwnerInitials(owner: VehicleOwner) {
  if (owner.type === 'NATURAL') {
    return `${owner.firstName?.[0] ?? ''}${owner.lastName?.[0] ?? ''}`.toUpperCase()
  }
  return (owner.legalName ?? 'S').slice(0, 2).toUpperCase()
}

export function mapVehicleFormValues(values: VehicleFormValues): {
  plate: string
  brand: string
  model: string
  year: number
  customerId: string
} {
  return {
    plate: normalizePlate(values.plate),
    brand: values.brand.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    customerId: values.customerId,
  }
}

export function mapVehicleToFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: String(vehicle.year),
    customerId: vehicle.customerId,
  }
}
