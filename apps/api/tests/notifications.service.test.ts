import { beforeEach, describe, expect, it, vi } from 'vitest'
import { notificationsRepository } from '../src/modules/notifications/notifications.repository.js'
import { notificationsService } from '../src/modules/notifications/notifications.service.js'

vi.mock('../src/modules/notifications/notifications.repository.js')

const dummyUser = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Usuario Notif',
  email: 'notif@torcly.com',
  username: 'notif',
  permissions: ['purchases:read', 'notifications:read'],
}

const dummyContext = {
  requestId: 'req-abc-123',
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
}

describe('notificationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listNotifications (Aislamiento por usuario y permisos)', () => {
    it('lista notificaciones del usuario autenticado aplicando filtros y paginación', async () => {
      vi.mocked(
        notificationsRepository.listNotifications,
      ).mockResolvedValueOnce({
        items: [
          {
            id: 'notif-1',
            userId: dummyUser.id,
            title: 'Compra recibida',
            message: 'La compra COMPRA-000001 ha sido recibida.',
            type: 'PURCHASE_RECEIVED',
            link: '/compras',
            permissionRequired: 'purchases:read',
            read: false,
            readAt: null,
            createdAt: new Date('2026-10-24T10:00:00Z'),
          },
        ],
        total: 1,
      })

      const result = await notificationsService.listNotifications(dummyUser, {
        read: 'all',
        page: 1,
        pageSize: 20,
      })

      expect(notificationsRepository.listNotifications).toHaveBeenCalledWith(
        dummyUser.id,
        { read: 'all', page: 1, pageSize: 20 },
        dummyUser.permissions,
      )
      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe('notif-1')
      expect(result.data[0].title).toBe('Compra recibida')
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('getUnreadCount', () => {
    it('devuelve el número de no leídas para el usuario', async () => {
      vi.mocked(notificationsRepository.getUnreadCount).mockResolvedValueOnce(3)

      const result = await notificationsService.getUnreadCount(dummyUser)

      expect(notificationsRepository.getUnreadCount).toHaveBeenCalledWith(
        dummyUser.id,
        dummyUser.permissions,
      )
      expect(result.count).toBe(3)
    })
  })

  describe('markAsRead (Idempotencia)', () => {
    it('marca una notificación como leída si pertenece al usuario', async () => {
      vi.mocked(notificationsRepository.markAsRead).mockResolvedValueOnce({
        id: 'notif-1',
        userId: dummyUser.id,
        title: 'Compra recibida',
        message: 'Compra recibida',
        type: 'PURCHASE_RECEIVED',
        link: '/compras',
        permissionRequired: 'purchases:read',
        read: true,
        readAt: new Date(),
        createdAt: new Date(),
      })

      const result = await notificationsService.markAsRead(
        'notif-1',
        dummyUser,
        dummyContext,
      )

      expect(result.read).toBe(true)
      expect(notificationsRepository.markAsRead).toHaveBeenCalledWith(
        'notif-1',
        dummyUser.id,
        dummyUser.permissions,
        dummyContext,
      )
    })

    it('es idempotente: si ya estaba leída devuelve el resultado sin error', async () => {
      vi.mocked(notificationsRepository.markAsRead).mockResolvedValueOnce({
        id: 'notif-1',
        userId: dummyUser.id,
        title: 'Compra recibida',
        message: 'Compra recibida',
        type: 'PURCHASE_RECEIVED',
        link: '/compras',
        permissionRequired: 'purchases:read',
        read: true,
        readAt: new Date('2026-10-24T09:00:00Z'),
        createdAt: new Date('2026-10-24T08:00:00Z'),
      })

      const result = await notificationsService.markAsRead(
        'notif-1',
        dummyUser,
        dummyContext,
      )

      expect(result.read).toBe(true)
      expect(result.readAt).toBe('2026-10-24T09:00:00.000Z')
    })

    it('lanza 404 si la notificación no existe o no pertenece al usuario', async () => {
      vi.mocked(notificationsRepository.markAsRead).mockResolvedValueOnce(null)

      await expect(
        notificationsService.markAsRead('notif-ajena', dummyUser, dummyContext),
      ).rejects.toThrow(/Notificación no encontrada/)
    })
  })

  describe('markAllAsRead (Idempotencia)', () => {
    it('marca todas las no leídas autorizadas y retorna el conteo', async () => {
      vi.mocked(notificationsRepository.markAllAsRead).mockResolvedValueOnce({
        updatedCount: 4,
      })

      const result = await notificationsService.markAllAsRead(
        dummyUser,
        dummyContext,
      )

      expect(result.updatedCount).toBe(4)
      expect(notificationsRepository.markAllAsRead).toHaveBeenCalledWith(
        dummyUser.id,
        dummyUser.permissions,
        dummyContext,
      )
    })

    it('es idempotente cuando no hay notificaciones pendientes', async () => {
      vi.mocked(notificationsRepository.markAllAsRead).mockResolvedValueOnce({
        updatedCount: 0,
      })

      const result = await notificationsService.markAllAsRead(
        dummyUser,
        dummyContext,
      )

      expect(result.updatedCount).toBe(0)
    })
  })

  describe('notifyUsersSafely (Fallo seguro y no bloqueo)', () => {
    it('emite notificaciones a usuarios elegibles según permiso y preferencias', async () => {
      vi.mocked(
        notificationsRepository.findUsersEligibleForNotification,
      ).mockResolvedValueOnce([
        { id: 'user-1', notificationPreferences: { purchaseReceived: true } },
        { id: 'user-2', notificationPreferences: null },
      ])

      await notificationsService.notifyUsersSafely({
        permission: 'purchases:read',
        type: 'PURCHASE_RECEIVED',
        preferenceKey: 'purchaseReceived',
        title: 'Compra recibida',
        message: 'COMPRA-001',
        link: '/compras',
      })

      expect(
        notificationsRepository.createNotificationsBatch,
      ).toHaveBeenCalledWith([
        {
          userId: 'user-1',
          title: 'Compra recibida',
          message: 'COMPRA-001',
          type: 'PURCHASE_RECEIVED',
          link: '/compras',
          permissionRequired: 'purchases:read',
        },
        {
          userId: 'user-2',
          title: 'Compra recibida',
          message: 'COMPRA-001',
          type: 'PURCHASE_RECEIVED',
          link: '/compras',
          permissionRequired: 'purchases:read',
        },
      ])
    })

    it('no lanza error si la persistencia de notificaciones falla (resiliencia transaccional)', async () => {
      vi.mocked(
        notificationsRepository.findUsersEligibleForNotification,
      ).mockRejectedValueOnce(new Error('Database connection failed'))

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Debe resolver limpiamente sin propagar el error a la transacción de negocio
      await expect(
        notificationsService.notifyUsersSafely({
          permission: 'purchases:read',
          type: 'PURCHASE_RECEIVED',
          title: 'Compra recibida',
          message: 'COMPRA-001',
        }),
      ).resolves.toBeUndefined()

      expect(warnSpy).toHaveBeenCalledWith(
        '[notifications] safe_delivery_failed',
      )
      warnSpy.mockRestore()
    })
  })
})
