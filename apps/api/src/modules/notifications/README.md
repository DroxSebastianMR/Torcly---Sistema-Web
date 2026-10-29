# Notifications (API)

Gestión de notificaciones persistentes por usuario con aislamiento estricto y emisión segura desde eventos del dominio.

## Endpoints

- `GET /api/v1/notifications` — Listado paginado de notificaciones del usuario autenticado (filtros por `read` y `type`). Se filtran automáticamente avisos de entidades sobre las cuales el usuario carezca de permiso. Requiere `notifications:read`.
- `GET /api/v1/notifications/unread-count` — Retorna el conteo de notificaciones no leídas (`{ count: number }`). Requiere `notifications:read`.
- `PATCH /api/v1/notifications/:id/read` — Marca una notificación como leída. Acción idempotente (si ya fue leída, no repite auditoría ni falla). Requiere `notifications:read`.
- `POST /api/v1/notifications/mark-all-read` — Marca todas las notificaciones no leídas del usuario como leídas. Acción idempotente con registro de auditoría (`ALL_NOTIFICATIONS_READ`). Requiere `notifications:read`.

## Reglas Críticas

1. **Aislamiento por usuario**: La API filtra siempre y exclusivamente por `userId: request.auth.id`. No es posible leer ni marcar notificaciones de otros usuarios.
2. **Autorización de origen**: Si una notificación está vinculada a un permiso operativo (`permissionRequired`), los usuarios sin ese permiso no la reciben ni pueden consultarla.
3. **Resiliencia en operaciones críticas**: `notifyUsersSafely` nunca bloquea ni revierte transacciones del dominio (compras, citas, órdenes, pagos o inventario). En caso de fallo en la BD de notificaciones, el error se atrapa y registra de forma segura sin propagarse a la operación principal.
4. **Preferencias del usuario**: Solo se emiten notificaciones a usuarios activos que no hayan desactivado la categoría en su perfil.

Sprint propietario: 18.
