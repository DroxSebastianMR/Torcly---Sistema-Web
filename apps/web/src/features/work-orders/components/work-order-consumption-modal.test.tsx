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
import { WorkOrderConsumptionModal } from './work-order-consumption-modal'
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
  'No hay repuestos pendientes. Solo aparecen los productos del presupuesto aprobado que aún tienen cantidad por consumir.'

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

describe('Modal de consumo de repuestos (QA-06)', () => {
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

  it('explica que solo aparecen productos del presupuesto aprobado pendientes', async () => {
    const user = userEvent.setup()
    render(
      <WorkOrderConsumptionModal
        open
        order={order}
        execution={execution([line({ pending: 0 })])}
        onClose={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Repuesto a consumir' }),
    )

    expect(screen.getByText(emptyMessage)).toBeTruthy()
  })

  it('muestra los productos con cantidad pendiente por consumir', async () => {
    const user = userEvent.setup()
    render(
      <WorkOrderConsumptionModal
        open
        order={order}
        execution={execution([line({ pending: 2 })])}
        onClose={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Repuesto a consumir' }),
    )

    expect(screen.getByText('Aceite 20W50 · ACE-01')).toBeTruthy()
    expect(screen.queryByText(emptyMessage)).toBeNull()
  })

  it('rechaza cantidades con más de tres decimales sin registrar consumo', async () => {
    const user = userEvent.setup()
    const mutations = {
      consume: { isPending: false, mutateAsync: vi.fn() },
      returnProducts: { isPending: false, mutateAsync: vi.fn() },
    }
    workOrders.useWorkOrdersMutations.mockReturnValue(mutations)
    render(
      <WorkOrderConsumptionModal
        open
        order={order}
        execution={execution([line({ pending: 2 })])}
        onClose={vi.fn()}
      />,
    )

    await user.click(
      screen.getByRole('button', { name: 'Repuesto a consumir' }),
    )
    await user.click(screen.getByRole('option', { name: /Aceite 20W50/ }))
    const quantity = screen.getByLabelText('Cantidad a consumir')
    fireEvent.change(quantity, { target: { value: '1.2345' } })
    await user.click(screen.getByRole('button', { name: 'Registrar consumo' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Selecciona un repuesto y una cantidad válida.',
      ),
    )
    expect(mutations.consume.mutateAsync).not.toHaveBeenCalled()
  })
})
