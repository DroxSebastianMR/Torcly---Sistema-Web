import { z } from 'zod'
import {
  hasAtMostThreeDecimals,
  QUANTITY_MAX_DECIMALS_MESSAGE,
} from '../../shared/validation/quantity.js'

export const supplierIdSchema = z.object({
  id: z.uuid('Proveedor inválido.'),
})

export const supplierQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.enum(['true', 'false', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const supplierInputSchema = z
  .object({
    legalName: z
      .string()
      .trim()
      .min(2, 'La razón social debe tener al menos 2 caracteres.')
      .max(150, 'La razón social es demasiado larga.'),
    documentNumber: z
      .string()
      .trim()
      .min(3, 'El documento debe tener al menos 3 caracteres.')
      .max(30, 'El documento es demasiado largo.'),
    contactName: z
      .string()
      .trim()
      .max(100, 'El nombre de contacto es demasiado largo.')
      .nullish()
      .transform((v) => v ?? null),
    phone: z
      .string()
      .trim()
      .max(30, 'El teléfono es demasiado largo.')
      .nullish()
      .transform((v) => v ?? null),
    email: z
      .string()
      .trim()
      .email('Correo inválido.')
      .max(254)
      .nullish()
      .transform((v) => v ?? null),
  })
  .strict()

export const purchaseIdSchema = z.object({
  id: z.uuid('Compra inválida.'),
})

export const purchaseQuerySchema = z.object({
  supplierId: z.uuid('Proveedor inválido.').optional(),
  status: z.enum(['all', 'DRAFT', 'RECEIVED', 'CANCELLED']).default('all'),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const purchaseLineInputSchema = z
  .object({
    productId: z.uuid('Producto inválido.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.')
      .refine(hasAtMostThreeDecimals, QUANTITY_MAX_DECIMALS_MESSAGE),
    unitCost: z.coerce
      .number()
      .finite()
      .min(0, 'El costo no puede ser negativo.')
      .max(9_999_999_999, 'El costo es demasiado grande.'),
  })
  .strict()

export const purchaseInputSchema = z
  .object({
    supplierId: z.uuid('Proveedor inválido.'),
    purchaseDate: z.string().date('Fecha de compra inválida.'),
    externalRef: z
      .string()
      .trim()
      .max(80, 'La referencia es demasiado larga.')
      .nullish()
      .transform((v) => v ?? null),
    notes: z
      .string()
      .trim()
      .max(500, 'Las notas son demasiado largas.')
      .nullish()
      .transform((v) => v ?? null),
    lines: z
      .array(purchaseLineInputSchema)
      .min(1, 'Agrega al menos un producto.')
      .max(100, 'Se permite un máximo de 100 líneas por compra.'),
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
  .strict()

export const purchaseLineIdSchema = z.object({
  id: z.uuid('Compra inválida.'),
  lineId: z.uuid('Línea inválida.'),
})

export const confirmPurchaseSchema = z
  .object({
    requestId: z
      .string()
      .trim()
      .min(1, 'El requestId es obligatorio.')
      .max(100, 'El requestId es demasiado largo.'),
  })
  .strict()

export type SupplierQueryDto = z.infer<typeof supplierQuerySchema>
export type SupplierInputDto = z.infer<typeof supplierInputSchema>
export type PurchaseQueryDto = z.infer<typeof purchaseQuerySchema>
export type PurchaseInputDto = z.infer<typeof purchaseInputSchema>
export type ConfirmPurchaseDto = z.infer<typeof confirmPurchaseSchema>
