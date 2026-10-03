import { z } from 'zod'

export const workOrderIdSchema = z.object({
  id: z.uuid('Orden de taller inválida.'),
})

export const workOrderStatusSchema = z.enum([
  'RECEPCIONADA',
  'EN_DIAGNOSTICO',
  'PENDIENTE_APROBACION',
  'APROBADA',
  'RECHAZADA',
  'EN_EJECUCION',
  'LISTA_PARA_ENTREGA',
  'ENTREGADA',
])

export const workOrderQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: workOrderStatusSchema.or(z.literal('all')).default('all'),
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

export const workOrderStartExecutionSchema = z.object({}).strict()

export const workOrderActivitySchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(3, 'La descripción de la actividad es obligatoria.')
      .max(500, 'La descripción no puede exceder los 500 caracteres.'),
    occurredAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD.')
      .optional(),
  })
  .strict()

export const workOrderCompleteActivitySchema = z.object({}).strict()

const workOrderConsumptionItemSchema = z
  .object({
    lineId: z.uuid('Línea del presupuesto inválida.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.'),
  })
  .strict()

export const workOrderConsumptionSchema = z
  .object({
    requestId: z.uuid('El identificador de la operación es inválido.'),
    items: z
      .array(workOrderConsumptionItemSchema)
      .min(1, 'Registra al menos un repuesto.')
      .max(100, 'Se permite un máximo de 100 ítems.'),
  })
  .strict()

const workOrderReturnItemSchema = z
  .object({
    lineId: z.uuid('Línea del presupuesto inválida.'),
    quantity: z.coerce
      .number()
      .finite()
      .min(0.001, 'La cantidad debe ser mayor a cero.')
      .max(999_999_999, 'La cantidad es demasiado grande.'),
    notes: z
      .string()
      .trim()
      .max(300, 'La observación no puede exceder los 300 caracteres.')
      .optional(),
  })
  .strict()

export const workOrderReturnSchema = z
  .object({
    requestId: z.uuid('El identificador de la operación es inválido.'),
    items: z
      .array(workOrderReturnItemSchema)
      .min(1, 'Registra al menos un repuesto.')
      .max(100, 'Se permite un máximo de 100 ítems.'),
  })
  .strict()

export const workOrderDeliverySchema = z
  .object({
    notes: z
      .string()
      .trim()
      .max(500, 'La observación no puede exceder los 500 caracteres.')
      .optional(),
  })
  .strict()

export const workOrderVehicleHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
})

export const workOrderActivityIdSchema = z.object({
  id: z.uuid('Orden de taller inválida.'),
  activityId: z.uuid('Actividad inválida.'),
})

export const workOrderVehicleIdSchema = z.object({
  vehicleId: z.uuid('Vehículo inválido.'),
})

export type WorkOrderQueryDto = z.infer<typeof workOrderQuerySchema>
export type WorkOrderBudgetDto = z.infer<typeof workOrderBudgetSchema>
export type WorkOrderDecisionDto = z.infer<typeof workOrderDecisionSchema>
export type WorkOrderTechnicianDto = z.infer<typeof workOrderTechnicianSchema>
export type WorkOrderActivityDto = z.infer<typeof workOrderActivitySchema>
export type WorkOrderConsumptionDto = z.infer<typeof workOrderConsumptionSchema>
export type WorkOrderReturnDto = z.infer<typeof workOrderReturnSchema>
export type WorkOrderDeliveryDto = z.infer<typeof workOrderDeliverySchema>
export type WorkOrderVehicleHistoryQueryDto = z.infer<
  typeof workOrderVehicleHistoryQuerySchema
>
