import { z } from 'zod'

export const fuelLevelOptions = [
  { value: 'EMPTY', label: 'Vacío / En reserva' },
  { value: 'QUARTER', label: '1/4 de tanque' },
  { value: 'HALF', label: '1/2 tanque' },
  { value: 'THREE_QUARTERS', label: '3/4 de tanque' },
  { value: 'FULL', label: 'Tanque lleno' },
] as const

export const directWorkOrderFormSchema = z.object({
  customerId: z.string().min(1, 'Selecciona un cliente.'),
  vehicleId: z.string().min(1, 'Selecciona un vehículo.'),
  currentMileage: z
    .number()
    .int('El kilometraje debe ser un número entero.')
    .min(0, 'El kilometraje no puede ser negativo.')
    .max(2_000_000, 'Kilometraje fuera de rango.')
    .nullable()
    .optional(),
  fuelLevel: z
    .enum(['EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL'])
    .nullable()
    .optional(),
  receptionNotes: z
    .string()
    .trim()
    .max(500, 'Las observaciones no pueden exceder los 500 caracteres.')
    .optional(),
})

export type DirectWorkOrderFormValues = z.infer<
  typeof directWorkOrderFormSchema
>
