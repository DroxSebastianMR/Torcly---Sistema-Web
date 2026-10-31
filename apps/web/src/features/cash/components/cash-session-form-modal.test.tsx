// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CashSession } from '../types/cash-session.types'
import { CashSessionFormModal } from './cash-session-form-modal'

const mutations = vi.hoisted(() => ({
  open: { isPending: false, mutateAsync: vi.fn() },
  close: { isPending: false, mutateAsync: vi.fn() },
}))

vi.mock('../hooks/use-cash-sessions', () => ({
  useCashSessionMutations: () => mutations,
}))

const session: CashSession = {
  id: 'cash-session-1',
  code: 'CAJA-000001',
  status: 'OPEN',
  openingAmount: 100,
  openingNotes: null,
  openedBy: 'Administradora',
  openedAt: '2026-10-30T15:00:00.000Z',
  expectedCashAmount: null,
  countedCashAmount: null,
  differenceAmount: null,
  closingNotes: null,
  closedBy: null,
  closedAt: null,
  totals: {
    payments: { cash: 50, card: 100, transfer: 70, digitalWallet: 40 },
    compensations: { cash: 0, card: 0, transfer: 0, digitalWallet: 0 },
    net: { cash: 50, card: 100, transfer: 70, digitalWallet: 40 },
    expectedCashAmount: 150,
  },
}

describe('CashSessionFormModal', () => {
  afterEach(cleanup)

  beforeEach(() => {
    mutations.open.mutateAsync.mockReset()
    mutations.close.mutateAsync.mockReset()
  })

  it('muestra el resumen neto por método antes de cerrar la caja', () => {
    render(
      <CashSessionFormModal
        mode="close"
        session={session}
        open
        onClose={vi.fn()}
      />,
    )

    const summary = screen.getByRole('region', {
      name: 'Resumen esperado del período',
    })
    expect(
      within(summary).getByText('Efectivo esperado').parentElement
        ?.parentElement?.textContent,
    ).toContain('S/ 150.00')
    expect(
      within(summary).getByText('Tarjeta').parentElement?.parentElement
        ?.textContent,
    ).toContain('S/ 100.00')
    expect(
      within(summary).getByText('Transferencia').parentElement?.parentElement
        ?.textContent,
    ).toContain('S/ 70.00')
    expect(
      within(summary).getByText('Billetera digital').parentElement
        ?.parentElement?.textContent,
    ).toContain('S/ 40.00')
    expect(summary.textContent).toContain('Total neto cobrado')
    expect(summary.textContent).toContain('S/ 260.00')
    expect(
      screen
        .getByRole('button', { name: 'Registrar cierre' })
        .querySelector('svg'),
    ).not.toBeNull()
  })
})
