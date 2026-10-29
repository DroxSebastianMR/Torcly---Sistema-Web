import { z } from 'zod'
import {
  hasAtMostThreeDecimals,
  QUANTITY_MAX_DECIMALS_MESSAGE,
} from '@/lib/quantity'

export const movementFormSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto.'),
  quantity: z.coerce
    .number<number>()
    .finite()
    .positive('La cantidad debe ser mayor que cero.')
    .max(999_999_999, 'La cantidad supera el límite permitido.')
    .refine(hasAtMostThreeDecimals, QUANTITY_MAX_DECIMALS_MESSAGE),
  sign: z.enum(['IN', 'OUT']),
  notes: z.string().trim().max(300),
})

export const movementKindSchema = z.enum([
  'INITIAL',
  'ENTRY',
  'EXIT',
  'ADJUSTMENT',
])

export type MovementFormValues = z.input<typeof movementFormSchema>
export type MovementFormKind = z.infer<typeof movementKindSchema>
