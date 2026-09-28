import { z } from 'zod'

export const VEHICLE_YEAR_MIN = 1950
export const VEHICLE_YEAR_MAX = new Date().getFullYear() + 1

export const CANONICAL_PLATE_PATTERN = /^[A-Z0-9]{5,8}$/

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, '').trim()
}

export const vehicleFormSchema = z
  .object({
    plate: z.string().trim(),
    brand: z.string().trim(),
    model: z.string().trim(),
    year: z.string().trim(),
    customerId: z.string(),
  })
  .superRefine((values, context) => {
    if (!CANONICAL_PLATE_PATTERN.test(normalizePlate(values.plate))) {
      context.addIssue({
        code: 'custom',
        path: ['plate'],
        message: 'La placa debe tener 5 a 8 letras y números.',
      })
    }

    if (!values.brand) {
      context.addIssue({
        code: 'custom',
        path: ['brand'],
        message: 'Ingresa la marca.',
      })
    } else if (values.brand.length > 80) {
      context.addIssue({
        code: 'custom',
        path: ['brand'],
        message: 'La marca no puede superar 80 caracteres.',
      })
    }

    if (!values.model) {
      context.addIssue({
        code: 'custom',
        path: ['model'],
        message: 'Ingresa el modelo.',
      })
    } else if (values.model.length > 120) {
      context.addIssue({
        code: 'custom',
        path: ['model'],
        message: 'El modelo no puede superar 120 caracteres.',
      })
    }

    const year = Number(values.year)
    if (!values.year) {
      context.addIssue({
        code: 'custom',
        path: ['year'],
        message: 'Ingresa el año.',
      })
    } else if (!Number.isInteger(year)) {
      context.addIssue({
        code: 'custom',
        path: ['year'],
        message: 'El año debe ser un número entero.',
      })
    } else if (year < VEHICLE_YEAR_MIN || year > VEHICLE_YEAR_MAX) {
      context.addIssue({
        code: 'custom',
        path: ['year'],
        message: `El año debe estar entre ${VEHICLE_YEAR_MIN} y ${VEHICLE_YEAR_MAX}.`,
      })
    }

    if (!values.customerId) {
      context.addIssue({
        code: 'custom',
        path: ['customerId'],
        message: 'Selecciona el propietario.',
      })
    }
  })

export type VehicleFormValues = {
  plate: string
  brand: string
  model: string
  year: string
  customerId: string
}

export const emptyVehicleForm: VehicleFormValues = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  customerId: '',
}
