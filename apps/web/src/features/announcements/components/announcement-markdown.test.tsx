// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AnnouncementMarkdown } from './announcement-markdown'

describe('AnnouncementMarkdown', () => {
  afterEach(() => {
    cleanup()
  })
  it('renderiza encabezados ### con estilos visuales destacados', () => {
    render(<AnnouncementMarkdown content="### Resumen de la Versión v1.1.2" />)
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeTruthy()
    expect(heading.textContent).toBe('Resumen de la Versión v1.1.2')
  })

  it('renderiza encabezados con espaciado # # # de forma compatible', () => {
    render(
      <AnnouncementMarkdown content="# # # Resumen de la Versión v1.1.2" />,
    )
    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toBeTruthy()
    expect(heading.textContent).toBe('Resumen de la Versión v1.1.2')
  })

  it('formatea texto en negrita y elimina los asteriscos del DOM', () => {
    render(
      <AnnouncementMarkdown content="Nos complace anunciar el despliegue oficial de **Torcly v1.1.2**." />,
    )
    const strong = screen.getByText('Torcly v1.1.2')
    expect(strong.tagName).toBe('STRONG')
    expect(screen.queryByText('**Torcly v1.1.2**')).toBeNull()
  })

  it('renderiza listas con viñetas numéricas estilizadas en lugar de asteriscos', () => {
    const markdown = `
- **Centro de Notificaciones:** Notificaciones en tiempo real
- **Bandeja Completa:** Filtros rápidos por fecha
`
    render(<AnnouncementMarkdown content={markdown} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Centro de Notificaciones:')).toBeTruthy()
    expect(screen.getByText('Bandeja Completa:')).toBeTruthy()
    expect(screen.queryByText(/-\s+\*\*/)).toBeNull()
  })

  it('renderiza listas numeradas explícitas 1. y 2.', () => {
    const markdown = `
1. **Primera mejora:** Base de datos
2. **Segunda mejora:** UI responsiva
`
    render(<AnnouncementMarkdown content={markdown} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(screen.getByText('Primera mejora:')).toBeTruthy()
    expect(screen.getByText('Segunda mejora:')).toBeTruthy()
  })
})
