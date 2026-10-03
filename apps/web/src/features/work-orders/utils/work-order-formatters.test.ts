import { describe, expect, it } from 'vitest'
import {
  canDecideWorkOrder,
  canDeliverWorkOrder,
  canFinalizeWorkOrder,
  canManageWorkOrderExecution,
  canSendWorkOrderBudget,
  canStartWorkOrderExecution,
  currencyFormatter,
  isWorkOrderBudgetEditable,
  isWorkOrderTechnicianEditable,
  workOrderActivityStatusLabel,
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
    expect(workOrderStatusLabel.EN_EJECUCION).toBe('En ejecución')
    expect(workOrderStatusLabel.LISTA_PARA_ENTREGA).toBe('Pta. entrega')
    expect(workOrderStatusLabel.ENTREGADA).toBe('Entregada')
  })

  it('etiqueta los estados de actividad', () => {
    expect(workOrderActivityStatusLabel.PENDIENTE).toBe('Pendiente')
    expect(workOrderActivityStatusLabel.COMPLETADA).toBe('Completada')
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

  it('inicio de ejecución solo aprobada con técnico asignado', () => {
    expect(canStartWorkOrderExecution('APROBADA', true)).toBe(true)
    expect(canStartWorkOrderExecution('APROBADA', false)).toBe(false)
    expect(canStartWorkOrderExecution('EN_EJECUCION', true)).toBe(false)
    expect(canStartWorkOrderExecution('PENDIENTE_APROBACION', true)).toBe(false)
  })

  it('gestión de ejecución, finalización y entrega según estado', () => {
    expect(canManageWorkOrderExecution('EN_EJECUCION')).toBe(true)
    expect(canManageWorkOrderExecution('APROBADA')).toBe(false)
    expect(canFinalizeWorkOrder('EN_EJECUCION')).toBe(true)
    expect(canFinalizeWorkOrder('LISTA_PARA_ENTREGA')).toBe(false)
    expect(canDeliverWorkOrder('LISTA_PARA_ENTREGA')).toBe(true)
    expect(canDeliverWorkOrder('EN_EJECUCION')).toBe(false)
    expect(canDeliverWorkOrder('ENTREGADA')).toBe(false)
  })

  it('formatea moneda en soles', () => {
    expect(currencyFormatter.format(49).replace(/\u00a0/g, ' ')).toBe(
      'S/ 49.00',
    )
  })
})
