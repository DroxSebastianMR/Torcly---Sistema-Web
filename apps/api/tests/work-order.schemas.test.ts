import { describe, expect, it } from 'vitest'
import {
  createWorkOrderSchema,
  workOrderBudgetSchema,
  workOrderDecisionSchema,
  workOrderDiagnosisSchema,
  workOrderQuerySchema,
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
})
