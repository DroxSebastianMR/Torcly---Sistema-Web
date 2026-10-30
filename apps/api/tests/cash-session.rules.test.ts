import { describe, expect, it } from 'vitest'
import {
  addMethodAmount,
  assertClosingNotes,
  assertNonNegativeCashAmount,
  roundCash,
  subtractMethodTotals,
  zeroMethodTotals,
} from '../src/modules/cash-sessions/cash-session.rules.js'

describe('Reglas de sesiones de caja', () => {
  it('acumula y separa importes por método', () => {
    let payments = zeroMethodTotals()
    payments = addMethodAmount(payments, 'CASH', 50.5)
    payments = addMethodAmount(payments, 'CARD', 25)
    const compensations = addMethodAmount(zeroMethodTotals(), 'CASH', 10.25)

    expect(payments).toMatchObject({ cash: 50.5, card: 25 })
    expect(subtractMethodTotals(payments, compensations)).toMatchObject({
      cash: 40.25,
      card: 25,
    })
  })

  it('redondea importes monetarios sin arrastrar precisión flotante', () => {
    expect(roundCash(0.1 + 0.2)).toBe(0.3)
    expect(roundCash(100.005)).toBe(100.01)
  })

  it('acepta cero en apertura o arqueo y rechaza negativos', () => {
    expect(() => assertNonNegativeCashAmount(0)).not.toThrow()
    expect(() => assertNonNegativeCashAmount(-0.01)).toThrow(/cero o mayor/)
  })

  it('exige observación cuando el arqueo tiene diferencia', () => {
    expect(() => assertClosingNotes(0, undefined)).not.toThrow()
    expect(() => assertClosingNotes(-1, undefined)).toThrow(/diferencia/)
    expect(() => assertClosingNotes(1, 'Sobrante identificado')).not.toThrow()
  })
})
