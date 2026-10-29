# Audit (API)

Consulta administrativa de solo lectura sobre el registro de auditoría (`AuditLog`), que ya escriben todos los módulos en la misma transacción.

- `GET /audit` exige sesión y permiso `audit:read`.
- Parámetros: `page` (≥1, por defecto 1), `pageSize` (1-100, por defecto 25), `event`, `from`, `to`, `actorId` e `identifier`.
- Orden estable: `createdAt` descendente y, como desempate, `id` descendente.
- Campos mínimos expuestos: `id`, `event`, `createdAt`, `userId`, `actorName`, `identifier`, `requestId`, `ipAddress`. Nunca se devuelven token, hash, contraseña, cookie, cabecera de autorización ni metadata sensible.
- Devuelve `{ items, page, pageSize, total, totalPages }`.
- Los eventos no autorizados o inexistentes no se representan como cero: el filtro se valida contra los eventos permitidos (`400` si es inválido).

El registro es append-only: este módulo solo lee; no expone mutaciones. Sprint propietario: 16 (HU-87).
