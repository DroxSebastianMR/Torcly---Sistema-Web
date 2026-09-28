// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SaleFormModal } from './sale-form-modal'
import type { SaleDetail } from '../types/sales.types'

const sales = vi.hoisted(() => ({
  useSaleMutations: vi.fn(),
  useSaleCatalog: vi.fn(),
}))
vi.mock('../hooks/use-sales', () => sales)

const customers = vi.hoisted(() => ({ useCustomers: vi.fn() }))
vi.mock('@/features/customers/hooks/use-customers', () => customers)

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const catalog = {
  products: [
    {
      productId: 'p1',
      code: 'REP-001',
      name: 'Filtro de aceite',
      unit: { name: 'Unidad', symbol: 'und' },
      active: true,
      salePrice: 12.5,
      stock: 5,
      lowStock: false,
    },
  ],
  services: [
    {
      id: 'sv1',
      code: 'CAMBIO-BOMBA',
      name: 'Cambio de bomba de agua',
      price: 250.5,
    },
  ],
}

const existingSale: SaleDetail = {
  id: 's1',
  code: 'VENTA-000001',
  customer: null,
  status: 'DRAFT',
  subtotal: 25,
  total: 25,
  lineCount: 1,
  performedBy: 'Admin',
  confirmedBy: null,
  confirmedAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  lines: [
    {
      id: 'l1',
      type: 'PRODUCT',
      productId: 'p1',
      serviceId: null,
      name: 'Filtro de aceite',
      code: 'REP-001',
      unitLabel: 'und',
      unitPrice: 12.5,
      quantity: 2,
      subtotal: 25,
    },
  ],
}

function renderModal({
  open = true,
  sale = null,
}: { open?: boolean; sale?: SaleDetail | null } = {}) {
  const onClose = vi.fn()
  render(<SaleFormModal open={open} sale={sale} onClose={onClose} />)
  return { onClose }
}

async function addProduct(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Producto a vender' }))
  await user.click(screen.getByRole('option', { name: /Filtro de aceite/ }))
  await user.click(screen.getAllByRole('button', { name: 'Agregar' })[0])
}

describe('Formulario de ventas', () => {
  beforeEach(() => {
    customers.useCustomers.mockReturnValue({ data: { data: [] } })
    sales.useSaleCatalog.mockReturnValue({
      data: catalog,
      refetch: vi.fn(),
    })
    sales.useSaleMutations.mockReturnValue({
      create: { isPending: false, mutateAsync: vi.fn() },
      update: { isPending: false, mutateAsync: vi.fn() },
      confirm: { isPending: false, mutateAsync: vi.fn() },
    })
  })

  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('valida el formulario sin líneas antes de guardar', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    expect(
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Agrega al menos un producto o servicio.',
        ),
      ),
    ).toBeTruthy()
    expect(sales.useSaleMutations).toHaveBeenCalled()
  })

  it('actualiza el catálogo al abrir para incluir servicios reactivados', () => {
    const refetch = vi.fn()
    sales.useSaleCatalog.mockReturnValue({ data: catalog, refetch })

    renderModal()

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('rechaza un producto con stock insuficiente', async () => {
    const user = userEvent.setup()
    renderModal()

    const quantityInput = screen.getByLabelText('Cantidad del producto')
    await user.clear(quantityInput)
    await user.type(quantityInput, '99')
    await user.click(screen.getByRole('button', { name: 'Producto a vender' }))
    await user.click(screen.getByRole('option', { name: /Filtro de aceite/ }))
    await user.click(screen.getAllByRole('button', { name: 'Agregar' })[0])

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Stock insuficiente'),
    )
  })

  it('registra un borrador con producto y servicio', async () => {
    const user = userEvent.setup()
    const mutations = {
      create: { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) },
      update: { isPending: false, mutateAsync: vi.fn() },
      confirm: { isPending: false, mutateAsync: vi.fn() },
    }
    sales.useSaleMutations.mockReturnValue(mutations)
    const { onClose } = renderModal()

    const quantityInput = screen.getByLabelText('Cantidad del producto')
    await user.clear(quantityInput)
    await user.type(quantityInput, '2')
    await addProduct(user)

    await user.click(screen.getByRole('button', { name: 'Servicio a vender' }))
    await user.click(
      screen.getByRole('option', { name: /Cambio de bomba de agua/ }),
    )
    await user.click(screen.getAllByRole('button', { name: 'Agregar' })[1])

    expect(screen.getAllByText('Filtro de aceite').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }))

    await waitFor(() =>
      expect(mutations.create.mutateAsync).toHaveBeenCalledWith({
        customerId: null,
        lines: [
          { type: 'PRODUCT', productId: 'p1', quantity: 2 },
          { type: 'SERVICE', serviceId: 'sv1' },
        ],
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Venta registrada como borrador.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('muestra el precio como referencia en las opciones de producto y servicio', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Producto a vender' }))
    expect(
      screen.getByRole('option', { name: /Filtro de aceite.*12\.50/ }),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Servicio a vender' }))
    expect(
      screen.getByRole('option', { name: /Cambio de bomba de agua.*250\.50/ }),
    ).toBeTruthy()
  })

  it('confirma la venta al crearla guardando primero el borrador', async () => {
    const user = userEvent.setup()
    const mutations = {
      create: {
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({ data: { id: 's9' } }),
      },
      update: { isPending: false, mutateAsync: vi.fn() },
      confirm: { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) },
    }
    sales.useSaleMutations.mockReturnValue(mutations)
    const { onClose } = renderModal()

    await addProduct(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }))

    await waitFor(() => expect(mutations.create.mutateAsync).toHaveBeenCalled())
    expect(mutations.confirm.mutateAsync).toHaveBeenCalledWith('s9')
    expect(toast.success).toHaveBeenCalledWith(
      'Venta confirmada correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('precarga la venta y confirma una existente con su actualización', async () => {
    const user = userEvent.setup()
    const mutations = {
      create: { isPending: false, mutateAsync: vi.fn() },
      update: {
        isPending: false,
        mutateAsync: vi.fn().mockResolvedValue({ data: existingSale }),
      },
      confirm: { isPending: false, mutateAsync: vi.fn().mockResolvedValue({}) },
    }
    sales.useSaleMutations.mockReturnValue(mutations)
    const { onClose } = renderModal({ sale: existingSale })

    expect(screen.getByRole('heading', { name: 'Editar venta' })).toBeTruthy()
    expect(screen.getByLabelText('Cantidad de Filtro de aceite')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }))

    await waitFor(() =>
      expect(mutations.update.mutateAsync).toHaveBeenCalledWith({
        id: 's1',
        input: expect.objectContaining({
          customerId: null,
          lines: [{ type: 'PRODUCT', productId: 'p1', quantity: 2 }],
        }),
      }),
    )
    expect(mutations.confirm.mutateAsync).toHaveBeenCalledWith('s1')
    expect(toast.success).toHaveBeenCalledWith(
      'Venta actualizada y confirmada.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
