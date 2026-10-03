import { describe, expect, it } from 'vitest'
import {
  createWorkOrderSchema,
  workOrderActivitySchema,
  workOrderBudgetSchema,
  workOrderConsumptionSchema,
  workOrderDecisionSchema,
  workOrderDeliverySchema,
  workOrderDiagnosisSchema,
  workOrderQuerySchema,
  workOrderReturnSchema,
  workOrderStartExecutionSchema,
  workOrderTechnicianSchema,
} from '../src/modules/work-orders/work-order.schemas.js'

describe('Schemas de órdenes de taller', () => {
  it('valida el identificador y la creación a partir de una cita', () => {
    expect(
      createWorkOrderSchema.parse({
        appointmentId: 'a0000000-0000-4000-8000-000000000001',
      }),
    ).toEqual({ appointmentId: 'a0000000-0000-4000-8000-000000000001' })
    expect(() =>
      createWorkOrderSchema.parse({ appointmentId: 'no-uuid' }),
    ).toThrow()
  })

  it('valida el diagnóstico con mínimo y máximo', () => {
    expect(
      workOrderDiagnosisSchema.parse({ diagnosis: 'Falla en frenos' }),
    ).toEqual({
      diagnosis: 'Falla en frenos',
    })
    expect(() => workOrderDiagnosisSchema.parse({ diagnosis: ' x ' })).toThrow()
    expect(() =>
      workOrderDiagnosisSchema.parse({ diagnosis: 'a'.repeat(1001) }),
    ).toThrow()
  })

  it('valida las líneas del presupuesto', () => {
    expect(
      workOrderBudgetSchema.parse({
        lines: [
          {
            type: 'SERVICE',
            serviceId: 'a0000000-0000-4000-8000-000000000001',
          },
        ],
      }),
    ).toEqual({
      lines: [
        { type: 'SERVICE', serviceId: 'a0000000-0000-4000-8000-000000000001' },
      ],
    })
    expect(() => workOrderBudgetSchema.parse({ lines: [] })).toThrow()
    expect(() =>
      workOrderBudgetSchema.parse({
        lines: [
          {
            type: 'PRODUCT',
            serviceId: 'a0000000-0000-4000-8000-000000000001',
          },
        ],
      }),
    ).toThrow()
    expect(() =>
      workOrderBudgetSchema.parse({
        lines: [
          {
            type: 'PRODUCT',
            productId: 'a0000000-0000-4000-8000-000000000001',
            quantity: 0,
          },
        ],
      }),
    ).toThrow()
  })

  it('valida la decisión con aprobación o rechazo y observación opcional', () => {
    expect(workOrderDecisionSchema.parse({ decision: 'APPROVED' })).toEqual({
      decision: 'APPROVED',
    })
    expect(
      workOrderDecisionSchema.parse({ decision: 'REJECTED', notes: 'Costoso' }),
    ).toEqual({ decision: 'REJECTED', notes: 'Costoso' })
    expect(() => workOrderDecisionSchema.parse({ decision: 'MAYBE' })).toThrow()
    expect(() =>
      workOrderDecisionSchema.parse({
        decision: 'APPROVED',
        notes: 'a'.repeat(501),
      }),
    ).toThrow()
  })

  it('valida la asignación de técnico nula o con uuid', () => {
    expect(workOrderTechnicianSchema.parse({ technicianId: null })).toEqual({
      technicianId: null,
    })
    expect(
      workOrderTechnicianSchema.parse({
        technicianId: 'a0000000-0000-4000-8000-000000000001',
      }),
    ).toEqual({ technicianId: 'a0000000-0000-4000-8000-000000000001' })
    expect(() =>
      workOrderTechnicianSchema.parse({ technicianId: 'no-uuid' }),
    ).toThrow()
  })

  it('exige un objeto vacío para las acciones de ejecución', () => {
    expect(workOrderStartExecutionSchema.parse({})).toEqual({})
    expect(() => workOrderStartExecutionSchema.parse(undefined)).toThrow()
    expect(() => workOrderStartExecutionSchema.parse({ unexpected: true })).toThrow()
  })

  it('valida filtros por estado y técnico', () => {
    expect(workOrderQuerySchema.parse({})).toMatchObject({
      status: 'all',
      page: 1,
      pageSize: 20,
    })
    expect(
      workOrderQuerySchema.parse({ status: 'EN_DIAGNOSTICO' }).status,
    ).toBe('EN_DIAGNOSTICO')
    expect(() => workOrderQuerySchema.parse({ status: 'TERMINADA' })).toThrow()
    expect(
      workOrderQuerySchema.parse({
        technicianId: 'a0000000-0000-4000-8000-000000000001',
      }).technicianId,
    ).toBe('a0000000-0000-4000-8000-000000000001')
  })

  it('acepta los nuevos estados de ejecución en los filtros', () => {
    expect(workOrderQuerySchema.parse({ status: 'EN_EJECUCION' }).status).toBe(
      'EN_EJECUCION',
    )
    expect(
      workOrderQuerySchema.parse({ status: 'LISTA_PARA_ENTREGA' }).status,
    ).toBe('LISTA_PARA_ENTREGA')
    expect(workOrderQuerySchema.parse({ status: 'ENTREGADA' }).status).toBe(
      'ENTREGADA',
    )
  })

  it('valida la actividad con descripción y fecha opcional', () => {
    expect(
      workOrderActivitySchema.parse({
        description: 'Revisar frenos',
        occurredAt: '2026-09-20',
      }),
    ).toEqual({ description: 'Revisar frenos', occurredAt: '2026-09-20' })
    expect(
      workOrderActivitySchema.parse({ description: 'Revisar frenos' }),
    ).toEqual({ description: 'Revisar frenos' })
    expect(() =>
      workOrderActivitySchema.parse({ description: ' x ' }),
    ).toThrow()
    expect(() =>
      workOrderActivitySchema.parse({
        description: 'a'.repeat(501),
      }),
    ).toThrow()
    expect(() =>
      workOrderActivitySchema.parse({
        description: 'Revisar frenos',
        occurredAt: '20/09/2026',
      }),
    ).toThrow()
  })

  it('valida el consumo con requestId e items de líneas', () => {
    const lineId = 'a0000000-0000-4000-8000-000000000001'
    const requestId = 'a0000000-0000-4000-8000-000000000002'
    expect(
      workOrderConsumptionSchema.parse({
        requestId,
        items: [{ lineId, quantity: 1 }],
      }),
    ).toEqual({ requestId, items: [{ lineId, quantity: 1 }] })
    expect(() => workOrderConsumptionSchema.parse({ items: [] })).toThrow()
    expect(() =>
      workOrderConsumptionSchema.parse({ requestId, items: [] }),
    ).toThrow()
    expect(() =>
      workOrderConsumptionSchema.parse({
        requestId,
        items: [{ lineId, quantity: 0 }],
      }),
    ).toThrow()
    expect(() =>
      workOrderConsumptionSchema.parse({
        requestId: 'no-uuid',
        items: [{ lineId, quantity: 1 }],
      }),
    ).toThrow()
  })

  it('valida la devolución con observación opcional', () => {
    const lineId = 'a0000000-0000-4000-8000-000000000001'
    const requestId = 'a0000000-0000-4000-8000-000000000002'
    expect(
      workOrderReturnSchema.parse({
        requestId,
        items: [{ lineId, quantity: 0.5, notes: 'Sobró aceite' }],
      }),
    ).toEqual({
      requestId,
      items: [{ lineId, quantity: 0.5, notes: 'Sobró aceite' }],
    })
    expect(() =>
      workOrderReturnSchema.parse({
        requestId,
        items: [{ lineId, quantity: 0.5, notes: 'a'.repeat(301) }],
      }),
    ).toThrow()
  })

  it('valida la entrega con observación opcional', () => {
    expect(workOrderDeliverySchema.parse({})).toEqual({})
    expect(
      workOrderDeliverySchema.parse({ notes: 'Cliente retiró el vehículo' }),
    ).toEqual({ notes: 'Cliente retiró el vehículo' })
    expect(() =>
      workOrderDeliverySchema.parse({ notes: 'a'.repeat(501) }),
    ).toThrow()
  })
})
