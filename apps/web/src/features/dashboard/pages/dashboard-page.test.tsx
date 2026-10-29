// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Page from './dashboard-page'

const operations = vi.hoisted(() => ({ useOperationsSummary: vi.fn() }))

vi.mock('../hooks/use-operations', () => ({
  useOperationsSummary: operations.useOperationsSummary,
}))

vi.mock('@/features/assistant/components/assistant-chat', () => ({
  AssistantChat: () => null,
}))

describe('Dashboard operativo', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra el contador del resumen sin solicitar listas de atención al montar', () => {
    operations.useOperationsSummary.mockReturnValue({
      data: {
        generatedAt: '2026-10-23T00:00:00.000Z',
        period: { from: null, to: null },
        sections: {
          appointments: {
            section: 'appointments',
            total: 4,
            byStatus: { PROGRAMADA: 3, CANCELADA: 1, ATENDIDA: 0 },
            attentionCount: 3,
          },
        },
        descriptors: {
          appointments: {
            section: 'appointments',
            label: 'Citas',
            source: 'appointments',
            periodField: 'date',
            criteria: 'Programadas',
            permissions: ['appointments:read'],
          },
        },
      },
      isError: false,
    })

    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    )

    expect(screen.getByText('3 elemento(s) requieren atención.')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Ver módulo/i })).toBeTruthy()
    expect(operations.useOperationsSummary).toHaveBeenCalledOnce()
  })
})
