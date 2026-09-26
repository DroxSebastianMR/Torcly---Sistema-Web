import { describe, expect, it } from 'vitest'
import {
  assertAppointmentAttendable,
  assertBudgetEditable,
  assertCanDecide,
  assertHasLines,
  assertTechnicianEditable,
  computeWorkOrderTotals,
  roundMoney,
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
})
