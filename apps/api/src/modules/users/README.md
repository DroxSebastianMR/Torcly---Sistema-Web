# Users (API)

Administra cuentas, rol y estado de acceso sin borrado físico. Depende de
`auth` para autenticación, permisos y contexto de auditoría (`RequestContext`).

## Responsabilidades

- listar, buscar, filtrar y paginar usuarios activos e inactivos;
- crear cuentas con identificador único (usuario/correo) y rol válido;
- actualizar datos permitidos (correo y nombre visible);
- cambiar el rol asignado a una cuenta;
- activar o desactivar cuentas revocando las sesiones activas al desactivar;
- conservar todas las referencias históricas de cuentas desactivadas;
- registrar cada operación sensible en `audit_logs`.

## Archivos principales

- `users.routes.ts` — rutas y middleware de permisos;
- `users.controller.ts` — traducción HTTP (sin reglas);
- `users.service.ts` — reglas de negocio y auditoría de errores;
- `users.repository.ts` — persistencia transaccional y auditoría;
- `users.schemas.ts` — schemas Zod de entrada/salida;
- `users.types.ts` — contratos del dominio.

## Endpoints

Base `/api/v1/users`. Toda ruta usa `requireAuth`; la lectura exige
`users:read` y cada escritura exige `users:write`.

| Método | Ruta          | Permiso       | Descripción                                        |
| ------ | ------------- | ------------- | -------------------------------------------------- |
| GET    | `/`           | `users:read`  | listado con `search`, `status`, `page`, `pageSize` |
| GET    | `/roles`      | `users:read`  | roles activos para formularios                     |
| GET    | `/:id`        | `users:read`  | detalle de un usuario con sus roles                |
| POST   | `/`           | `users:write` | crea cuenta con contraseña inicial y rol           |
| PUT    | `/:id`        | `users:write` | actualiza correo y nombre visible                  |
| PATCH  | `/:id/role`   | `users:write` | cambia el rol asignado                             |
| PATCH  | `/:id/status` | `users:write` | activa o desactiva y revoca sesiones               |

## Reglas y permisos

- El servidor valida permisos y datos; la UI solo los refleja.
- `username`, `email` y `displayName` se guardan minimizados/normalizados en
  `users` (única tabla, sin borrado físico).
- Un usuario no puede desactivar su propia cuenta ni cambiarse su propio rol
  (guarda contra bloqueo/`USER_SELF_OPERATION`). Decisión del Sprint 02.
- La contraseña solo se asigna al crear la cuenta; el cambio/reseteo queda fuera
  del alcance (módulo de perfil / sprint posterior).
- No existe borrado de usuarios en V1.0; `active = false` conserva historial.
- Desactivar revoca todas las sesiones activas (`auth_sessions.revoked_at`).

## Auditoría

`AuditEventType` nuevos (migración `20260924180000`):
`USER_CREATED`, `USER_UPDATED`, `USER_ROLE_CHANGED`, `USER_DEACTIVATED`,
`USER_ACTIVATED`. El cambio de rol guarda `fromRoleCode`/`toRoleCode` en
`metadata`.

## Relaciones

- `auth` provee `requireAuth`, `requirePermission`, `RequestContext` y
  el hash de contraseñas.
- `inventory_movements` y `auth_sessions` referencian `users`; la desactivación
  no elimina esos registros (RN-004, RN-041).

Sprint propietario: 02. Historias HU-03 a HU-06 (RF-USU-001 a RF-USU-016).
