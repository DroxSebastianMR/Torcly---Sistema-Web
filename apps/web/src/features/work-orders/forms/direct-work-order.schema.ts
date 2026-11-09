import { z } from 'zod'

export const receptionFuelLevelOptions = [
  { value: 'E', label: 'Vacío' },
  { value: '1/4', label: '1/4 de tanque' },
  { value: '1/2', label: '1/2 tanque' },
  { value: '3/4', label: '3/4 de tanque' },
  { value: 'F', label: 'Tanque lleno' },
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
  receptionNotes: z
    .string()
    .trim()
    .max(500, 'Las observaciones no pueden exceder los 500 caracteres.')
    .optional(),
  receptionFuelLevel: z.enum(['E', '1/4', '1/2', '3/4', 'F']),
  hasSpareTire: z.boolean(),
  hasJackAndTools: z.boolean(),
  hasVehicleDocuments: z.boolean(),
  hasRadioFaceplate: z.boolean(),
  externalDamageNotes: z
    .string()
    .trim()
    .max(1000, 'Los daños externos no pueden exceder los 1000 caracteres.')
    .optional(),
  photoUrls: z.string().optional(),
})

export type DirectWorkOrderFormValues = z.infer<
  typeof directWorkOrderFormSchema
>
