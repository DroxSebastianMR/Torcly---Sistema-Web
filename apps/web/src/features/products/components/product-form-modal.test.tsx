// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductFormModal } from './product-form-modal'
import type { Product, ProductOptions } from '../types/products.types'

const service = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  get: vi.fn(),
}))

vi.mock('../services/products.service', () => ({ productsService: service }))

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const options: ProductOptions = {
  categories: [{ id: 'cat1', name: 'Filtros' }],
  brands: [{ id: 'brand1', name: 'ACDelco' }],
  units: [{ id: 'unit1', name: 'Unidad', symbol: 'und' }],
}

const existingProduct: Product = {
  id: 'p1',
  code: 'REP-001',
  barcode: null,
  name: 'Filtro de aceite',
  description: null,
  categoryId: 'cat1',
  brandId: null,
  unitId: 'unit1',
  salePrice: 35.5,
  minimumStock: 4,
  stock: 12,
  lowStock: false,
  active: true,
  category: { id: 'cat1', name: 'Filtros' },
  brand: null,
  unit: { id: 'unit1', name: 'Unidad', symbol: 'und' },
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

function renderModal({
  open = true,
  product = null,
}: { open?: boolean; product?: Product | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <ProductFormModal
        open={open}
        product={product}
        options={options}
        onClose={onClose}
      />
    </QueryClientProvider>,
  )
  return { onClose }
}

async function selectCategoryAndUnit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Categoría' }))
  await user.click(await screen.findByRole('option', { name: 'Filtros' }))
  await user.click(screen.getByRole('button', { name: 'Unidad' }))
  await user.click(await screen.findByRole('option', { name: 'Unidad (und)' }))
}

describe('Formulario de productos', () => {
  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('valida el formulario sin enviar campos vacíos', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    expect(await screen.findByText(/Ingresa un código válido/)).toBeTruthy()
    expect(await screen.findByText('Ingresa el nombre.')).toBeTruthy()
    expect(await screen.findByText('Selecciona una categoría.')).toBeTruthy()
    expect(await screen.findByText('Selecciona una unidad.')).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })

  it('rechaza un precio negativo', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.type(screen.getByLabelText(/^código del producto/i), 'REP-001')
    await user.type(screen.getByLabelText(/^nombre del producto/i), 'Filtro')
    fireEvent.change(screen.getByLabelText(/^precio de venta/i), {
      target: { value: '-5' },
    })
    await selectCategoryAndUnit(user)
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    expect(
      await screen.findByText('El precio no puede ser negativo.'),
    ).toBeTruthy()
    expect(service.create).not.toHaveBeenCalled()
  })

  it('normaliza el código y envía el payload correcto al registrar', async () => {
    const user = userEvent.setup()
    service.create.mockResolvedValue({ data: {} })
    const { onClose } = renderModal()

    await user.type(screen.getByLabelText(/^código del producto/i), 'rep-001')
    await user.type(
      screen.getByLabelText(/^nombre del producto/i),
      'Filtro de aceite',
    )
    await user.type(screen.getByLabelText(/^precio de venta/i), '35.5')
    await selectCategoryAndUnit(user)
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    await waitFor(() =>
      expect(service.create).toHaveBeenCalledWith({
        code: 'REP-001',
        barcode: null,
        name: 'Filtro de aceite',
        description: null,
        categoryId: 'cat1',
        brandId: null,
        unitId: 'unit1',
        salePrice: 35.5,
        minimumStock: 1,
      }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Producto registrado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('el Enter en el código no envía el formulario (compatible con lector USB)', async () => {
    const user = userEvent.setup()
    service.create.mockResolvedValue({ data: {} })
    renderModal()

    const codeInput = screen.getByLabelText(/^código del producto/i)
    await user.type(codeInput, 'rep-999')
    await user.keyboard('{Enter}')

    expect((codeInput as HTMLInputElement).value).toBe('rep-999')
    expect(service.create).not.toHaveBeenCalled()

    const barcodeInput = screen.getByLabelText(/^código de barras/i)
    await user.type(barcodeInput, '7759999999999')
    await user.keyboard('{Enter}')

    expect((barcodeInput as HTMLInputElement).value).toBe('7759999999999')
    expect(service.create).not.toHaveBeenCalled()
  })

  it('precarga la ficha, muestra existencias de solo lectura y actualiza', async () => {
    const user = userEvent.setup()
    service.update.mockResolvedValue({ data: {} })
    const { onClose } = renderModal({ product: existingProduct })

    expect(
      (screen.getByLabelText(/^código del producto/i) as HTMLInputElement)
        .value,
    ).toBe('REP-001')
    expect(screen.getByText('Existencia disponible')).toBeTruthy()
    expect(screen.getByText('12 und')).toBeTruthy()
    expect(screen.getByText('Solo lectura')).toBeTruthy()

    const nameInput = screen.getByLabelText(/^nombre del producto/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Filtro premium')
    await user.click(screen.getByRole('button', { name: 'Guardar producto' }))

    await waitFor(() =>
      expect(service.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
          code: 'REP-001',
          name: 'Filtro premium',
          salePrice: 35.5,
          unitId: 'unit1',
        }),
      ),
    )
    expect(service.update).toHaveBeenCalledWith(
      'p1',
      expect.not.objectContaining({ stock: 12 }),
    )
    expect(toast.success).toHaveBeenCalledWith(
      'Producto actualizado correctamente.',
    )
    expect(onClose).toHaveBeenCalledOnce()
  })
})
