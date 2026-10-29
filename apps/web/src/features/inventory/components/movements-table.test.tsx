// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { InventoryMovement } from '../types/inventory.types'
import { MovementsTable } from './movements-table'

const movement: InventoryMovement = {
  id: 'movement-1',
  productId: 'product-1',
  product: {
    id: 'product-1',
    code: 'MANN-W71283',
    name: 'Filtro de aceite Mann W 712/83',
    unit: { name: 'Unidad', symbol: 'und' },
  },
  type: 'EXIT',
  quantity: 3,
  notes: null,
  performedBy: 'Arian',
  occurredAt: '2026-09-25T17:38:00.000Z',
  referenceType: 'sale',
  referenceId: '7313244e-f480-47e7-9c4b-3c64d2d8e022',
}

describe('Tabla de historial de inventario', () => {
  it('oculta referencias internas hasta que la función esté habilitada', () => {
    render(<MovementsTable movements={[movement]} loading={false} />)

    expect(screen.queryByText(movement.referenceId!)).toBeNull()
    expect(screen.queryByText('sale')).toBeNull()
    expect(screen.getByText('—')).toBeTruthy()
  })
})
