// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BarChart, type BarChartProps } from './bar-chart'

const baseProps: BarChartProps = {
  rows: [
    { key: '2026-10-01', label: '1 oct', count: 1, amount: 100 },
    { key: '2026-10-02', label: '2 oct', count: 2, amount: 200 },
  ],
  primary: 'count',
  ariaLabel: 'Barras por día',
  label: 'Tendencia',
  caption: 'Tendencia por período',
  countLabel: 'Registros',
  amountLabel: 'Importe',
  countFormatter: (value: number) => String(value),
  amountFormatter: (value: number) => `${value} PEN`,
}

function renderChart(overrides: Partial<BarChartProps> = {}) {
  return render(<BarChart {...baseProps} {...overrides} />)
}

describe('Gráfico de barras', () => {
  afterEach(() => cleanup())

  it('muestra la serie con alternativa tabular', () => {
    renderChart({})

    expect(screen.getByRole('img', { name: /Barras por día/ })).toBeTruthy()
    expect(screen.getAllByText('1 oct').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2 oct').length).toBeGreaterThan(0)
    expect(screen.getByText('Registros')).toBeTruthy()
    expect(screen.getByText('Importe')).toBeTruthy()
    expect(screen.getByRole('table')).toBeTruthy()
  })

  it('muestra vacío claro cuando la serie es de ceros', () => {
    renderChart({
      rows: [
        { key: '2026-10-01', label: '1 oct', count: 0, amount: 0 },
        { key: '2026-10-02', label: '2 oct', count: 0, amount: 0 },
      ],
      ariaLabel: 'Serie vacía',
    })

    expect(screen.getByText('Sin datos en el período.')).toBeTruthy()
    expect(screen.getByRole('table')).toBeTruthy()
  })

  it('mantiene la tabla equivalente incluso con valores negativos', () => {
    renderChart({
      rows: [{ key: '2026-10-01', label: '1 oct', count: 0, amount: -3 }],
      primary: 'amount',
      ariaLabel: 'Cantidad neta',
      countFormatter: (value: number) => String(value),
      amountFormatter: (value: number) => String(value),
    })

    expect(screen.getByRole('img', { name: /Cantidad neta/ })).toBeTruthy()
    expect(screen.getAllByText('-3').length).toBeGreaterThan(0)
    expect(screen.getByRole('table')).toBeTruthy()
  })
})
