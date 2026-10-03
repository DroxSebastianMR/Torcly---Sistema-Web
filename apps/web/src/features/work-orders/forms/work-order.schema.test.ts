import { describe, expect, it } from 'vitest'
import {
  workOrderActivitySchema,
  workOrderBudgetSchema,
  workOrderConsumptionSchema,
  workOrderDecisionSchema,
  workOrderDeliverySchema,
  workOrderDiagnosisSchema,
  workOrderLineDraftSchema,
  workOrderReturnSchema,
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

  it('acepta una actividad con descripción y fecha opcional', () => {
    expect(
      workOrderActivitySchema.parse({
        description: '  Revisar frenos  ',
      }),
    ).toMatchObject({ description: 'Revisar frenos' })
    expect(
      workOrderActivitySchema.parse({
        description: 'Revisar frenos',
        occurredAt: '2026-09-28',
      }),
    ).toMatchObject({ occurredAt: '2026-09-28' })
    expect(() =>
      workOrderActivitySchema.parse({ description: '  ' }),
    ).toThrowError('La descripción debe tener al menos 3 caracteres.')
  })

  it('el consumo exige línea y cantidad válida', () => {
    expect(
      workOrderConsumptionSchema.parse({
        lineId: 'a0000000-0000-4000-8000-000000000001',
        quantity: 1.5,
      }),
    ).toMatchObject({ quantity: 1.5 })
    expect(() =>
      workOrderConsumptionSchema.parse({ lineId: '', quantity: 1 }),
    ).toThrowError('Selecciona un producto.')
    expect(() =>
      workOrderConsumptionSchema.parse({
        lineId: 'a0000000-0000-4000-8000-000000000001',
        quantity: 0,
      }),
    ).toThrowError('La cantidad debe ser mayor a cero.')
  })

  it('la devolución admite notas y limita su extensión', () => {
    expect(
      workOrderReturnSchema.parse({
        lineId: 'a0000000-0000-4000-8000-000000000001',
        quantity: 1,
        notes: 'Sobró repuesto',
      }),
    ).toMatchObject({ notes: 'Sobró repuesto' })
    expect(() =>
      workOrderReturnSchema.parse({
        lineId: 'a0000000-0000-4000-8000-000000000001',
        quantity: 1,
        notes: 'x'.repeat(301),
      }),
    ).toThrowError('Las notas no pueden superar los 300 caracteres.')
  })

  it('la entrega es válida con o sin notas', () => {
    expect(workOrderDeliverySchema.parse({ notes: '' })).toEqual({ notes: '' })
    expect(
      workOrderDeliverySchema.parse({ notes: 'Entregado al cliente' }),
    ).toMatchObject({ notes: 'Entregado al cliente' })
    expect(() =>
      workOrderDeliverySchema.parse({ notes: 'x'.repeat(501) }),
    ).toThrowError('Las notas no pueden superar los 500 caracteres.')
  })
})
