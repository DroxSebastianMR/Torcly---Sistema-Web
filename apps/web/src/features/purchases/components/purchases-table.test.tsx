// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PurchaseSummary } from '../types/purchases.types'
import { PurchasesTable } from './purchases-table'

afterEach(() => {
  cleanup()
})

const mockPurchase: PurchaseSummary = {
  id: 'purch-1',
  code: 'COMPRA-000001',
  supplier: {
    id: 'supp-1',
    legalName: 'Distribuidora Automotriz SAC',
    documentNumber: '20123456789',
  },
  status: 'DRAFT',
  externalRef: 'F001-1234',
  purchaseDate: '2026-10-24',
  total: 250.75,
  lineCount: 3,
  performedBy: 'Arian',
  receivedBy: null,
  receivedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  createdAt: '2026-10-24T10:00:00.000Z',
  updatedAt: '2026-10-24T10:00:00.000Z',
}

describe('PurchasesTable', () => {
  it('muestra estado vacío cuando no hay compras', () => {
    render(<PurchasesTable purchases={[]} loading={false} onOpen={vi.fn()} />)
    expect(screen.getByText('No se encontraron compras')).toBeTruthy()
  })

  it('renderiza la lista de compras con código, proveedor y estado', () => {
    render(
      <PurchasesTable
        purchases={[mockPurchase]}
        loading={false}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getAllByText('COMPRA-000001').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('Distribuidora Automotriz SAC').length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Borrador').length).toBeGreaterThan(0)
  })

  it('llama a onOpen al hacer clic en el botón de ver compra', () => {
    const handleOpen = vi.fn()
    render(
      <PurchasesTable
        purchases={[mockPurchase]}
        loading={false}
        onOpen={handleOpen}
      />,
    )

    const viewButtons = screen.getAllByRole('button', {
      name: 'Ver compra COMPRA-000001',
    })
    fireEvent.click(viewButtons[0]!)
    expect(handleOpen).toHaveBeenCalledWith(mockPurchase)
  })
})
