import { z } from 'zod'
import {
  CANONICAL_PLATE_PATTERN,
  normalizePlate,
  VEHICLE_YEAR_MAX,
  VEHICLE_YEAR_MIN,
} from './vehicles.utils.js'

export const vehicleIdSchema = z.object({
  id: z.uuid('Vehículo inválido.'),
})

const plateInputSchema = z
  .string()
  .trim()
  .min(5, 'Ingresa la placa del vehículo.')
  .max(12, 'La placa es demasiado larga.')
  .transform(normalizePlate)
  .refine(
    (value) => CANONICAL_PLATE_PATTERN.test(value),
    'La placa debe contener solo letras y números (5 a 8 caracteres).',
  )

const brandSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa la marca.')
  .max(80, 'La marca no puede superar 80 caracteres.')

const modelSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa el modelo.')
  .max(120, 'El modelo no puede superar 120 caracteres.')

const yearSchema = z.coerce
  .number()
  .int('El año debe ser un número entero.')
  .min(VEHICLE_YEAR_MIN, `El año mínimo es ${VEHICLE_YEAR_MIN}.`)
  .max(VEHICLE_YEAR_MAX, `El año máximo es ${VEHICLE_YEAR_MAX}.`)

export const vehicleQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  customerId: z.uuid('Cliente inválido.').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const vehicleInputSchema = z.object({
  plate: plateInputSchema,
  brand: brandSchema,
  model: modelSchema,
  year: yearSchema,
  customerId: z.uuid('Selecciona un propietario válido.'),
})

export const vehicleUpdateSchema = z.object({
  plate: plateInputSchema,
  brand: brandSchema,
  model: modelSchema,
  year: yearSchema,
})

export type VehicleInputDto = z.infer<typeof vehicleInputSchema>
export type VehicleUpdateDto = z.infer<typeof vehicleUpdateSchema>
export type VehicleQueryDto = z.infer<typeof vehicleQuerySchema>
