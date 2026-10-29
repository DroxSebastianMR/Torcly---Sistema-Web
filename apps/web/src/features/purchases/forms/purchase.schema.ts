import { z } from 'zod'
import {
  hasAtMostThreeDecimals,
  QUANTITY_MAX_DECIMALS_MESSAGE,
} from '@/lib/quantity'

export const purchaseLineSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto.'),
  quantity: z
    .number()
    .finite('La cantidad debe ser finita.')
    .min(0.001, 'La cantidad debe ser mayor a cero.')
    .max(999_999_999, 'La cantidad es demasiado grande.')
    .refine(hasAtMostThreeDecimals, QUANTITY_MAX_DECIMALS_MESSAGE),
  unitCost: z
    .number()
    .finite('El costo debe ser finito.')
    .min(0, 'El costo no puede ser negativo.'),
  productName: z.string().optional(),
  productCode: z.string().optional(),
  unitLabel: z.string().nullable().optional(),
})

export const purchaseFormSchema = z
  .object({
    supplierId: z.string().min(1, 'Selecciona un proveedor.'),
    purchaseDate: z.string().min(1, 'Fecha requerida.'),
    externalRef: z.string().max(80, 'Máximo 80 caracteres.').optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres.').optional(),
    lines: z
      .array(purchaseLineSchema)
      .min(1, 'Agrega al menos un producto a la compra.'),
  })
  .superRefine((purchase, context) => {
    const seenProductIds = new Set<string>()

    purchase.lines.forEach((line, index) => {
      if (seenProductIds.has(line.productId)) {
        context.addIssue({
          code: 'custom',
          path: ['lines', index, 'productId'],
          message: 'Cada producto solo puede agregarse una vez a la compra.',
        })
      }
      seenProductIds.add(line.productId)
    })
  })

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>
export type PurchaseLineDraft = z.infer<typeof purchaseLineSchema>
