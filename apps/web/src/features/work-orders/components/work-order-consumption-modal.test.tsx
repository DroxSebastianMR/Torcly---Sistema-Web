// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

describe('Modal de consumo de repuestos', () => {
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

  it('explica cuando no existen productos pendientes', () => {
    render(
      <WorkOrderConsumptionModal
        open
        order={order}
        execution={execution([line({ pending: 0 })])}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText(emptyMessage)).toBeTruthy()
  })

  it('permite marcar todos los repuestos pendientes', async () => {
    const user = userEvent.setup()
    render(
      <WorkOrderConsumptionModal
        open
        order={order}
        execution={execution([
          line({ pending: 2 }),
          line({ lineId: 'line-2', name: 'Bujía', pending: 1 }),
        ])}
        onClose={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Marcar todos' }))

    expect(
      (
        screen.getByRole('checkbox', {
          name: /Aceite 20W50/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true)
    expect(
      (screen.getByRole('checkbox', { name: /Bujía/ }) as HTMLInputElement)
        .checked,
    ).toBe(true)
  })

  it('envía en una sola operación los repuestos seleccionados', async () => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockResolvedValue({})
    workOrders.useWorkOrdersMutations.mockReturnValue({
      consume: { isPending: false, mutateAsync },
      returnProducts: { isPending: false, mutateAsync: vi.fn() },
    })
    render(
      <WorkOrderConsumptionModal
        open
        order={order}
        execution={execution([
          line({ pending: 2 }),
          line({ lineId: 'line-2', name: 'Bujía', pending: 1 }),
        ])}
        onClose={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Marcar todos' }))
    await user.clear(screen.getByLabelText('Cantidad para Aceite 20W50'))
    await user.type(screen.getByLabelText('Cantidad para Aceite 20W50'), '1.5')
    await user.click(screen.getByRole('button', { name: 'Registrar consumos' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    expect(mutateAsync).toHaveBeenCalledWith({
      id: 'wo-1',
      input: {
        requestId: expect.any(String),
        items: [
          { lineId: 'line-1', quantity: 1.5 },
          { lineId: 'line-2', quantity: 1 },
        ],
      },
    })
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

    await user.click(screen.getByRole('checkbox', { name: /Aceite 20W50/ }))
    await user.clear(screen.getByLabelText('Cantidad para Aceite 20W50'))
    await user.type(
      screen.getByLabelText('Cantidad para Aceite 20W50'),
      '1.2345',
    )
    await user.click(screen.getByRole('button', { name: 'Registrar consumos' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(mutations.consume.mutateAsync).not.toHaveBeenCalled()
  })
})
