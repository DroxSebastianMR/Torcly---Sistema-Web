// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkOrderReturnModal } from './work-order-return-modal'
import type {
  WorkOrderDetail,
  WorkOrderExecution,
  WorkOrderProductLineConsumption,
} from '../types/work-orders.types'

const workOrders = vi.hoisted(() => ({ useWorkOrdersMutations: vi.fn() }))
vi.mock('../hooks/use-work-orders', () => workOrders)

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const order = { id: 'wo-1', code: 'OT-000001' } as WorkOrderDetail
const emptyMessage =
  'No hay repuestos por devolver. Solo aparecen los productos del presupuesto aprobado que se consumieron y aún no se devolvieron.'

function line(
  overrides: Partial<WorkOrderProductLineConsumption> = {},
): WorkOrderProductLineConsumption {
  return {
    lineId: 'line-1',
    productId: 'product-1',
    name: 'Aceite 20W50',
    code: 'ACE-01',
    unitLabel: 'L',
    budgeted: 4,
    consumed: 0,
    returned: 0,
    netConsumed: 0,
    pending: 4,
    ...overrides,
  }
}

function execution(
  productLines: WorkOrderProductLineConsumption[],
): WorkOrderExecution {
  return {
    workOrderId: 'wo-1',
    code: 'OT-000001',
    status: 'EN_EJECUCION',
    startedBy: 'Admin',
    startedAt: '2026-01-02T00:00:00.000Z',
    readyForDeliveryAt: null,
    deliveredBy: null,
    deliveredAt: null,
    deliveryNotes: null,
    activities: [],
    productLines,
    consumptions: [],
  }
}

describe('Modal de devolución de repuestos (QA-06)', () => {
  beforeEach(() => {
    workOrders.useWorkOrdersMutations.mockReturnValue({
      consume: { isPending: false, mutateAsync: vi.fn() },
      returnProducts: { isPending: false, mutateAsync: vi.fn() },
    })
  })

  afterEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('explica que solo aparecen productos consumidos que aún no se devolvieron', async () => {
    const user = userEvent.setup()
    render(
      <WorkOrderReturnModal
        open
        order={order}
        execution={execution([line({ netConsumed: 0 })])}
        onClose={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Repuesto a devolver' }),
    )

    expect(screen.getByText(emptyMessage)).toBeTruthy()
  })

  it('rechaza cantidades con más de tres decimales sin registrar devolución', async () => {
    const user = userEvent.setup()
    const mutations = {
      consume: { isPending: false, mutateAsync: vi.fn() },
      returnProducts: { isPending: false, mutateAsync: vi.fn() },
    }
    workOrders.useWorkOrdersMutations.mockReturnValue(mutations)
    render(
      <WorkOrderReturnModal
        open
        order={order}
        execution={execution([
          line({ consumed: 2, netConsumed: 2, returned: 0, pending: 2 }),
        ])}
        onClose={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Repuesto a devolver' }),
    )
    await user.click(screen.getByRole('option', { name: /Aceite 20W50/ }))
    const quantity = screen.getByLabelText('Cantidad a devolver')
    fireEvent.change(quantity, { target: { value: '1.2345' } })
    await user.click(
      screen.getByRole('button', { name: 'Registrar devolución' }),
    )

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Selecciona un repuesto y una cantidad válida.',
      ),
    )
    expect(mutations.returnProducts.mutateAsync).not.toHaveBeenCalled()
  })
})
