import { z } from 'zod'

export interface WorkOrderLineDraft {
  type: 'PRODUCT' | 'SERVICE'
  referenceId: string
  name: string
  code: string
  unitLabel: string | null
  unitPrice: number
  quantity: number
}

export const workOrderDiagnosisSchema = z.object({
  diagnosis: z
    .string()
    .trim()
    .min(3, 'El diagnóstico debe tener al menos 3 caracteres.')
    .max(4000, 'El diagnóstico no puede superar los 4000 caracteres.'),
})

export const workOrderLineDraftSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  referenceId: z.string().min(1, 'Selecciona un item.'),
  name: z.string().min(1),
  code: z.string().min(1),
  unitLabel: z.string().nullable(),
  unitPrice: z.number().finite().min(0),
  quantity: z
    .number()
    .finite()
    .min(0.001, 'La cantidad debe ser mayor a cero.'),
})

export const workOrderBudgetSchema = z.object({
  addQuantity: z
    .number()
    .finite()
    .min(0.001, 'La cantidad debe ser mayor a cero.'),
  lines: z
    .array(workOrderLineDraftSchema)
    .min(1, 'Agrega al menos un producto o servicio.'),
})

export const workOrderDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z
    .string()
    .trim()
    .max(2000, 'Las observaciones no pueden superar los 2000 caracteres.'),
})

export const workOrderTechnicianSchema = z.object({
  technicianId: z.string().nullable(),
})

export const workOrderActivitySchema = z.object({
  description: z
    .string()
    .trim()
    .min(3, 'La descripción debe tener al menos 3 caracteres.')
    .max(500, 'La descripción no puede superar los 500 caracteres.'),
  occurredAt: z.string().trim().optional(),
})

export const workOrderConsumptionSchema = z.object({
  lineId: z.string().min(1, 'Selecciona un producto.'),
  quantity: z
    .number()
    .finite()
    .min(0.001, 'La cantidad debe ser mayor a cero.'),
})

export const workOrderReturnSchema = z.object({
  lineId: z.string().min(1, 'Selecciona un producto.'),
  quantity: z
    .number()
    .finite()
    .min(0.001, 'La cantidad debe ser mayor a cero.'),
  notes: z
    .string()
    .trim()
    .max(300, 'Las notas no pueden superar los 300 caracteres.'),
})

export const workOrderDeliverySchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, 'Las notas no pueden superar los 500 caracteres.'),
})

export type WorkOrderDiagnosisFormValues = {
  diagnosis: string
}

export type WorkOrderBudgetFormValues = {
  addQuantity: number
  lines: WorkOrderLineDraft[]
}

export type WorkOrderDecisionFormValues = {
  decision: 'APPROVED' | 'REJECTED'
  notes: string
}

export type WorkOrderTechnicianFormValues = {
  technicianId: string
}

export type WorkOrderActivityFormValues = {
  description: string
  occurredAt?: string
}

export type WorkOrderConsumptionFormValues = {
  lineId: string
  quantity: number
}

export type WorkOrderReturnFormValues = {
  lineId: string
  quantity: number
  notes: string
}

export type WorkOrderDeliveryFormValues = {
  notes: string
}

export const createWorkOrderLineDraft = (
  line: Omit<WorkOrderLineDraft, 'quantity'>,
  quantity: number,
): WorkOrderLineDraft => ({ ...line, quantity })
