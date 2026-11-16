// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementAdminFormModal } from './announcement-admin-form-modal'
import type { AnnouncementItem } from '../types/announcements.types'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const mockAnnouncement: AnnouncementItem = {
  id: 'ann-1',
  title: 'Torcly Release v1.1.2',
  summary: 'Resumen descriptivo del anuncio existente.',
  content: 'Contenido completo para pruebas de edición de anuncio.',
  type: 'UPDATE',
  status: 'PUBLISHED',
  versionTag: 'v1.1.2',
  videoUrl: 'https://youtube.com/watch?v=123',
  startsAt: null,
  endsAt: null,
  publishedAt: '2026-11-05T00:00:00.000Z',
  createdBy: 'admin',
  createdAt: '2026-11-05T00:00:00.000Z',
  updatedAt: '2026-11-05T00:00:00.000Z',
  isRead: false,
  readAt: null,
}

describe('AnnouncementAdminFormModal', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('muestra errores customizados en los campos obligatorios al intentar enviar formulario vacío', async () => {
    const onSubmitCreate = vi.fn()
    const onSubmitUpdate = vi.fn()
    const onClose = vi.fn()

    render(
      <AnnouncementAdminFormModal
        open={true}
        onClose={onClose}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
      />,
    )

    const submitBtn = screen.getByRole('button', {
      name: /publicar anuncio/i,
    })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(
        screen.getByText('El título debe tener al menos 3 caracteres.'),
      ).toBeTruthy()
      expect(
        screen.getByText('El resumen debe tener al menos 5 caracteres.'),
      ).toBeTruthy()
      expect(
        screen.getByText('El contenido debe tener al menos 10 caracteres.'),
      ).toBeTruthy()
    })

    expect(onSubmitCreate).not.toHaveBeenCalled()
  })

  it('precarga datos correctamente al editar un anuncio existente', async () => {
    const onSubmitCreate = vi.fn()
    const onSubmitUpdate = vi.fn()
    const onClose = vi.fn()

    render(
      <AnnouncementAdminFormModal
        open={true}
        initialData={mockAnnouncement}
        onClose={onClose}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
      />,
    )

    expect(
      screen.getByRole('heading', { name: /editar anuncio saas/i }),
    ).toBeTruthy()
    expect(screen.getByDisplayValue(mockAnnouncement.title)).toBeTruthy()
    expect(screen.getByDisplayValue(mockAnnouncement.summary)).toBeTruthy()
    expect(screen.getByDisplayValue(mockAnnouncement.content)).toBeTruthy()
  })

  it('envía los datos del nuevo anuncio cuando la validación pasa', async () => {
    const onSubmitCreate = vi.fn().mockResolvedValue(undefined)
    const onSubmitUpdate = vi.fn()
    const onClose = vi.fn()

    render(
      <AnnouncementAdminFormModal
        open={true}
        onClose={onClose}
        onSubmitCreate={onSubmitCreate}
        onSubmitUpdate={onSubmitUpdate}
      />,
    )

    await userEvent.type(
      screen.getByLabelText(/título del anuncio/i),
      'Nuevo Release de Pruebas',
    )
    await userEvent.type(
      screen.getByLabelText(/resumen breve/i),
      'Resumen de pruebas para anuncio',
    )
    await userEvent.type(
      screen.getByLabelText(/contenido completo/i),
      'Detalle del contenido completo con más de diez caracteres.',
    )

    const submitBtn = screen.getByRole('button', {
      name: /publicar anuncio/i,
    })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSubmitCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nuevo Release de Pruebas',
          summary: 'Resumen de pruebas para anuncio',
          content: 'Detalle del contenido completo con más de diez caracteres.',
          type: 'UPDATE',
          status: 'PUBLISHED',
        }),
      )
      expect(onClose).toHaveBeenCalled()
    })
  }, 15000)
})
