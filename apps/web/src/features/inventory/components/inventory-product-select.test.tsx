// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { inventoryService } from '../services/inventory.service'
import { InventoryProductSelect } from './inventory-product-select'

it('encuentra y selecciona una válvula fuera de la primera página por búsqueda o paginación', async () => {
  const user = userEvent.setup()
  const catalog = Array.from({ length: 101 }, (_, i) => ({
    productId: String(i),
    code: `REP-${i}`,
    name: i === 100 ? 'Válvula IAC' : `Bobina ${i}`,
    active: true,
    unit: { name: 'Unidad', symbol: 'und' },
    stock: 2,
    minimumStock: 0,
    lowStock: false,
    lastMovementAt: null,
  }))
  const spy = vi
    .spyOn(inventoryService, 'listExistence')
    .mockImplementation(async ({ page, pageSize, search }) => {
      const matches = catalog.filter((p) => p.name.includes(search))
      return {
        data: matches.slice((page - 1) * pageSize, page * pageSize),
        pagination: {
          page,
          pageSize,
          total: matches.length,
          totalPages: Math.ceil(matches.length / pageSize),
        },
      }
    })
  const client = new QueryClient()
  try {
    const onChange = vi.fn()
    render(
      <QueryClientProvider client={client}>
        <InventoryProductSelect value="" activeOnly onChange={onChange} />
      </QueryClientProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Producto' }))
    await user.click(
      await screen.findByRole('button', { name: 'Cargar más productos' }),
    )
    await screen.findByRole('option', { name: /Válvula IAC/ })
    await user.type(
      screen.getByPlaceholderText('Buscar por nombre o código…'),
      'Válvula',
    )
    await user.click(await screen.findByRole('option', { name: /Válvula IAC/ }))
    expect(spy).toHaveBeenCalledWith(
      { page: 1, pageSize: 100, search: 'Válvula' },
      expect.anything(),
    )
    expect(onChange).toHaveBeenCalledWith(catalog[100])
  } finally {
    spy.mockRestore()
    client.clear()
  }
})
