import { describe, expect, it } from 'vitest'
import {
  workOrderBudgetSchema,
  workOrderDecisionSchema,
  workOrderDiagnosisSchema,
  workOrderLineDraftSchema,
  workOrderTechnicianSchema,
} from './work-order.schema'

describe('Esquemas de órdenes de taller (web)', () => {
  it('acepta un diagnóstico válido y recorta espacios', () => {
    const input = workOrderDiagnosisSchema.parse({
      diagnosis: '  Falla en el sistema de frenos  ',
    })
    expect(input.diagnosis).toBe('Falla en el sistema de frenos')
  })

  it('rechaza un diagnóstico muy corto o vacío', () => {
    expect(() =>
      workOrderDiagnosisSchema.parse({ diagnosis: '  ' }),
    ).toThrowError('El diagnóstico debe tener al menos 3 caracteres.')
    expect(() =>
      workOrderDiagnosisSchema.parse({ diagnosis: 'a' }),
    ).toThrowError('El diagnóstico debe tener al menos 3 caracteres.')
  })

  it('acepta una línea de producto con cantidad válida', () => {
    const line = workOrderLineDraftSchema.parse({
      type: 'PRODUCT',
      referenceId: 'p1',
      name: 'Aceite 20W50',
      code: 'ACE-01',
      unitLabel: 'L',
      unitPrice: 25,
      quantity: 2,
    })
    expect(line.quantity).toBe(2)
    expect(() =>
      workOrderLineDraftSchema.parse({ ...line, quantity: 0 }),
    ).toThrowError('La cantidad debe ser mayor a cero.')
  })

  it('el presupuesto exige al menos una línea', () => {
    expect(() =>
      workOrderBudgetSchema.parse({ addQuantity: 1, lines: [] }),
    ).toThrowError('Agrega al menos un producto o servicio.')
  })

  it('acepta una decisión de aprobación y una de rechazo con observación', () => {
    expect(
      workOrderDecisionSchema.parse({ decision: 'APPROVED', notes: '' }),
    ).toMatchObject({ decision: 'APPROVED' })
    expect(
      workOrderDecisionSchema.parse({
        decision: 'REJECTED',
        notes: 'Muy caro',
      }),
    ).toMatchObject({ decision: 'REJECTED', notes: 'Muy caro' })
    expect(() =>
      workOrderDecisionSchema.parse({ decision: 'MAYBE' }),
    ).toThrowError()
  })

  it('acepta un técnico asignado o nulo', () => {
    expect(workOrderTechnicianSchema.parse({ technicianId: null })).toEqual({
      technicianId: null,
    })
    expect(
      workOrderTechnicianSchema.parse({
        technicianId: 'a0000000-0000-4000-8000-000000000001',
      }),
    ).toEqual({ technicianId: 'a0000000-0000-4000-8000-000000000001' })
  })
})
