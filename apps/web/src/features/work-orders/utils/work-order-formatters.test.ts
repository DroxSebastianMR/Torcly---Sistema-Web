import { describe, expect, it } from 'vitest'
import {
  canDecideWorkOrder,
  canSendWorkOrderBudget,
  currencyFormatter,
  isWorkOrderBudgetEditable,
  isWorkOrderTechnicianEditable,
  workOrderLineSubtotal,
  workOrderStatusLabel,
} from './work-order-formatters'

describe('Formateadores de órdenes de taller (web)', () => {
  it('etiqueta los estados de la orden', () => {
    expect(workOrderStatusLabel.RECEPCIONADA).toBe('Recepcionada')
    expect(workOrderStatusLabel.EN_DIAGNOSTICO).toBe('En diagnóstico')
    expect(workOrderStatusLabel.PENDIENTE_APROBACION).toBe('Pte. aprobación')
    expect(workOrderStatusLabel.APROBADA).toBe('Aprobada')
    expect(workOrderStatusLabel.RECHAZADA).toBe('Rechazada')
  })

  it('calcula el subtotal de una línea sin errores de redondeo', () => {
    expect(workOrderLineSubtotal({ unitPrice: 0.1, quantity: 3 })).toBe(0.3)
    expect(workOrderLineSubtotal({ unitPrice: 24.5, quantity: 2 })).toBe(49)
  })

  it('ediciones: diagnóstico y presupuesto editables hasta pte. aprobación', () => {
    expect(isWorkOrderBudgetEditable('RECEPCIONADA')).toBe(true)
    expect(isWorkOrderBudgetEditable('EN_DIAGNOSTICO')).toBe(true)
    expect(isWorkOrderBudgetEditable('PENDIENTE_APROBACION')).toBe(true)
    expect(isWorkOrderBudgetEditable('APROBADA')).toBe(false)
    expect(isWorkOrderBudgetEditable('RECHAZADA')).toBe(false)
  })

  it('técnico editable hasta aprobada', () => {
    expect(isWorkOrderTechnicianEditable('RECEPCIONADA')).toBe(true)
    expect(isWorkOrderTechnicianEditable('APROBADA')).toBe(true)
    expect(isWorkOrderTechnicianEditable('RECHAZADA')).toBe(false)
  })

  it('envío del presupuesto según estado y líneas', () => {
    expect(canSendWorkOrderBudget('EN_DIAGNOSTICO', 1)).toBe(true)
    expect(canSendWorkOrderBudget('EN_DIAGNOSTICO', 0)).toBe(false)
    expect(canSendWorkOrderBudget('APROBADA', 2)).toBe(false)
  })

  it('decisión solo en pendiente de aprobación', () => {
    expect(canDecideWorkOrder('PENDIENTE_APROBACION')).toBe(true)
    expect(canDecideWorkOrder('APROBADA')).toBe(false)
  })

  it('formatea moneda en soles', () => {
    expect(currencyFormatter.format(49).replace(/\u00a0/g, ' ')).toBe(
      'S/ 49.00',
    )
  })
})
