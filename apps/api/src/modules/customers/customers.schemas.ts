import { z } from 'zod'
import {
  CANONICAL_PLATE_PATTERN,
  normalizePlate,
  VEHICLE_YEAR_MAX,
  VEHICLE_YEAR_MIN,
} from '../vehicles/vehicles.utils.js'

const emailInput = z
  .email('Ingresa un correo electrónico válido.')
  .max(254)
  .optional()
  .nullable()
  .transform((value) => value || null)

const phoneInput = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{5,14}$/, 'Ingresa un teléfono válido.')

export const customerVehicleInputSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(5, 'Ingresa la placa del vehículo.')
    .max(12, 'La placa es demasiado larga.')
    .transform(normalizePlate)
    .refine(
      (value) => CANONICAL_PLATE_PATTERN.test(value),
      'La placa debe contener solo letras y números (5 a 8 caracteres).',
    ),
  brand: z
    .string()
    .trim()
    .min(1, 'Ingresa la marca.')
    .max(80, 'La marca no puede superar 80 caracteres.'),
  model: z
    .string()
    .trim()
    .min(1, 'Ingresa el modelo.')
    .max(120, 'El modelo no puede superar 120 caracteres.'),
  year: z.coerce
    .number()
    .int('El año debe ser un número entero.')
    .min(VEHICLE_YEAR_MIN, `El año mínimo es ${VEHICLE_YEAR_MIN}.`)
    .max(VEHICLE_YEAR_MAX, `El año máximo es ${VEHICLE_YEAR_MAX}.`),
  mileage: z.coerce
    .number()
    .int('El kilometraje debe ser un entero.')
    .min(0, 'El kilometraje no puede ser negativo.')
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? null : val)),
})

const naturalFields = {
  type: z.literal('NATURAL'),
  documentNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos.'),
  firstName: z.string().trim().min(2, 'Ingresa los nombres.').max(80),
  lastName: z.string().trim().min(2, 'Ingresa los apellidos.').max(80),
  phone: phoneInput,
  email: emailInput,
  vehicle: customerVehicleInputSchema.optional().nullable(),
}

const legalFields = {
  type: z.literal('LEGAL'),
  documentNumber: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos.'),
  legalName: z.string().trim().min(3, 'Ingresa la razón social.').max(160),
  phone: phoneInput,
  email: emailInput,
  vehicle: customerVehicleInputSchema.optional().nullable(),
}

export const customerIdSchema = z.object({
  id: z.uuid('Cliente inválido.'),
})

export const customerQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  type: z.enum(['all', 'NATURAL', 'LEGAL']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(10),
})

export const customerInputSchema = z.discriminatedUnion('type', [
  z.object(naturalFields),
  z.object(legalFields),
])

export type CustomerInputDto = z.infer<typeof customerInputSchema>
export type CustomerQueryDto = z.infer<typeof customerQuerySchema>
