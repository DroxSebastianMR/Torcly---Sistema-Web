import { z } from 'zod'

export const workOrderIdSchema = z.object({
  id: z.uuid('Orden de taller inválida.'),
})

export const workOrderQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z
    .enum([
      'all',
      'RECEPCIONADA',
      'EN_DIAGNOSTICO',
      'PENDIENTE_APROBACION',
      'APROBADA',
      'RECHAZADA',
    ])
    .default('all'),
  technicianId: z.uuid('Técnico inválido.').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const createWorkOrderSchema = z
  .object({
    appointmentId: z.uuid('Cita inválida.'),
  })
  .strict()

export const workOrderDiagnosisSchema = z
  .object({
    diagnosis: z
      .string()
      .trim()
      .min(3, 'El diagnóstico es obligatorio.')
      .max(1000, 'El diagnóstico no puede exceder los 1000 caracteres.'),
  })
  .strict()

const workOrderProductLineSchema = z
  .object({
    type: z.literal('PRODUCT'),
    productId: z.uuid('Producto inválido.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.'),
  })
  .strict()

const workOrderServiceLineSchema = z
  .object({
    type: z.literal('SERVICE'),
    serviceId: z.uuid('Servicio inválido.'),
  })
  .strict()

export const workOrderLineInputSchema = z.discriminatedUnion('type', [
  workOrderProductLineSchema,
  workOrderServiceLineSchema,
])

export const workOrderBudgetSchema = z
  .object({
    lines: z
      .array(workOrderLineInputSchema)
      .min(1, 'Agrega al menos un producto o servicio.')
      .max(100, 'Se permite un máximo de 100 líneas por presupuesto.'),
  })
  .strict()

export const workOrderDecisionSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    notes: z
      .string()
      .trim()
      .max(500, 'La observación no puede exceder los 500 caracteres.')
      .optional(),
  })
  .strict()

export const workOrderTechnicianSchema = z
  .object({
    technicianId: z
      .uuid('Técnico inválido.')
      .nullable()
      .transform((value) => value ?? null),
  })
  .strict()

export const workOrderSendBudgetSchema = z.object({}).strict()

export type WorkOrderQueryDto = z.infer<typeof workOrderQuerySchema>
export type WorkOrderBudgetDto = z.infer<typeof workOrderBudgetSchema>
export type WorkOrderDecisionDto = z.infer<typeof workOrderDecisionSchema>
export type WorkOrderTechnicianDto = z.infer<typeof workOrderTechnicianSchema>
