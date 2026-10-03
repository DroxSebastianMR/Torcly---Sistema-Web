import { describe, expect, it } from 'vitest'
import {
  assertAppointmentAttendable,
  assertBudgetEditable,
  assertCanCompleteActivity,
  assertCanConsume,
  assertCanDecide,
  assertCanDeliver,
  assertCanFinalize,
  assertCanRegisterActivity,
  assertCanReturn,
  assertCanStartExecution,
  assertHasLines,
  assertTechnicianEditable,
  computeNetConsumed,
  computeWorkOrderTotals,
  roundMoney,
  roundQuantity,
  shouldMoveToDiagnosis,
} from '../src/modules/work-orders/work-order.rules.js'

describe('Reglas de órdenes de taller', () => {
  it('redondea dinero y calcula totales', () => {
    expect(roundMoney(10.005)).toBe(10.01)
    expect(computeWorkOrderTotals([{ unitPrice: 10.5, quantity: 2 }])).toEqual({
      subtotal: 21,
      total: 21,
    })
  })

  it('rechaza presupuestos sin líneas', () => {
    expect(() => assertHasLines([])).toThrowError(
      expect.objectContaining({
        status: 400,
        code: 'WORK_ORDER_NO_LINES',
      }),
    )
    expect(() => assertHasLines([0])).not.toThrow()
  })

  it('solo atiende citas programadas', () => {
    expect(() =>
      assertAppointmentAttendable({
        code: 'CITA-000001',
        status: 'PROGRAMADA',
      }),
    ).not.toThrow()
    for (const status of ['CANCELADA', 'ATENDIDA']) {
      expect(() =>
        assertAppointmentAttendable({ code: 'CITA-000002', status }),
      ).toThrowError(
        expect.objectContaining({
          status: 409,
          code: 'APPOINTMENT_NOT_ATTENDABLE',
        }),
      )
    }
  })

  it('permite editar diagnóstico y presupuesto solo en estados pre-decisión', () => {
    for (const status of [
      'RECEPCIONADA',
      'EN_DIAGNOSTICO',
      'PENDIENTE_APROBACION',
    ]) {
      expect(() =>
        assertBudgetEditable({ code: 'OT-000001', status: status as never }),
      ).not.toThrow()
    }
    for (const status of ['APROBADA', 'RECHAZADA']) {
      expect(() =>
        assertBudgetEditable({ code: 'OT-000002', status: status as never }),
      ).toThrowError(
        expect.objectContaining({
          status: 409,
          code: 'WORK_ORDER_STATUS_INVALID',
        }),
      )
    }
  })

  it('permite cambiar el técnico hasta la aprobación', () => {
    for (const status of [
      'RECEPCIONADA',
      'EN_DIAGNOSTICO',
      'PENDIENTE_APROBACION',
      'APROBADA',
    ]) {
      expect(() =>
        assertTechnicianEditable({
          code: 'OT-000001',
          status: status as never,
        }),
      ).not.toThrow()
    }
    expect(() =>
      assertTechnicianEditable({ code: 'OT-000002', status: 'RECHAZADA' }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'WORK_ORDER_STATUS_INVALID',
      }),
    )
  })

  it('solo decide una orden pendiente con presupuesto enviado', () => {
    expect(() =>
      assertCanDecide({
        code: 'OT-000001',
        status: 'PENDIENTE_APROBACION',
        budgetSentAt: new Date(),
      }),
    ).not.toThrow()
    expect(() =>
      assertCanDecide({
        code: 'OT-000002',
        status: 'APROBADA',
        budgetSentAt: new Date(),
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'WORK_ORDER_BUDGET_NOT_SENT',
      }),
    )
    expect(() =>
      assertCanDecide({
        code: 'OT-000003',
        status: 'PENDIENTE_APROBACION',
        budgetSentAt: null,
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'WORK_ORDER_BUDGET_NOT_SENT',
      }),
    )
  })

  it('mueve a diagnóstico solo desde recepcionada', () => {
    expect(shouldMoveToDiagnosis('RECEPCIONADA')).toBe('EN_DIAGNOSTICO')
    expect(shouldMoveToDiagnosis('EN_DIAGNOSTICO')).toBe('EN_DIAGNOSTICO')
    expect(shouldMoveToDiagnosis('APROBADA')).toBe('APROBADA')
  })

  it('inicia la ejecución solo sobre órdenes aprobadas con técnico', () => {
    expect(() =>
      assertCanStartExecution({
        code: 'OT-000001',
        status: 'APROBADA',
        technicianId: 'a0000000-0000-4000-8000-000000000001',
      }),
    ).not.toThrow()
    expect(() =>
      assertCanStartExecution({
        code: 'OT-000002',
        status: 'EN_DIAGNOSTICO',
        technicianId: 'a0000000-0000-4000-8000-000000000001',
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'WORK_ORDER_STATUS_INVALID',
      }),
    )
    expect(() =>
      assertCanStartExecution({
        code: 'OT-000003',
        status: 'APROBADA',
        technicianId: null,
      }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'WORK_ORDER_TECHNICIAN_REQUIRED',
      }),
    )
  })

  it('exige estar en ejecución para actividades, consumos y finalización', () => {
    for (const assert of [
      assertCanRegisterActivity,
      assertCanCompleteActivity,
      assertCanConsume,
      assertCanReturn,
      assertCanFinalize,
    ]) {
      expect(() =>
        assert({ code: 'OT-000001', status: 'EN_EJECUCION' }),
      ).not.toThrow()
      for (const status of [
        'RECEPCIONADA',
        'APROBADA',
        'LISTA_PARA_ENTREGA',
        'ENTREGADA',
      ]) {
        expect(() =>
          assert({ code: 'OT-000002', status: status as never }),
        ).toThrowError(
          expect.objectContaining({
            status: 409,
            code: 'WORK_ORDER_STATUS_INVALID',
          }),
        )
      }
    }
  })

  it('solo entrega órdenes listas para entrega', () => {
    expect(() =>
      assertCanDeliver({ code: 'OT-000001', status: 'LISTA_PARA_ENTREGA' }),
    ).not.toThrow()
    expect(() =>
      assertCanDeliver({ code: 'OT-000002', status: 'EN_EJECUCION' }),
    ).toThrowError(
      expect.objectContaining({
        status: 409,
        code: 'WORK_ORDER_STATUS_INVALID',
      }),
    )
  })

  it('redondea cantidades y calcula el neto consumido', () => {
    expect(roundQuantity(1.0004)).toBe(1)
    expect(roundQuantity(1.0006)).toBe(1.001)
    expect(
      computeNetConsumed([
        { type: 'CONSUMPTION', quantity: 2 },
        { type: 'CONSUMPTION', quantity: 0.5 },
        { type: 'RETURN', quantity: 0.5 },
      ]),
    ).toBe(2)
    expect(computeNetConsumed([])).toBe(0)
  })
})
