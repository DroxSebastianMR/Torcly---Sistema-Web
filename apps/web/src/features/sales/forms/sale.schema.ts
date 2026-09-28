import { z } from 'zod'

export interface SaleLineDraft {
  type: 'PRODUCT' | 'SERVICE'
  referenceId: string
  name: string
  code: string
  unitLabel: string | null
  unitPrice: number
  stock?: number
  quantity: number
}

export const saleLineDraftSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  referenceId: z.string().min(1, 'Selecciona un item.'),
  name: z.string().min(1),
  code: z.string().min(1),
  unitLabel: z.string().nullable(),
  unitPrice: z.number().finite().min(0),
  stock: z.number().finite().min(0).optional(),
  quantity: z
    .number()
    .finite()
    .min(0.001, 'La cantidad debe ser mayor a cero.'),
})

export const saleFormSchema = z.object({
  customerId: z.string(),
  addQuantity: z
    .number()
    .finite()
    .min(0.001, 'La cantidad debe ser mayor a cero.'),
  lines: z
    .array(saleLineDraftSchema)
    .min(1, 'Agrega al menos un producto o servicio.'),
})

export type SaleFormValues = {
  customerId: string
  addQuantity: number
  lines: SaleLineDraft[]
}

export const createSaleDraft = (
  line: Omit<SaleLineDraft, 'quantity'>,
  quantity: number,
): SaleLineDraft => ({ ...line, quantity })
