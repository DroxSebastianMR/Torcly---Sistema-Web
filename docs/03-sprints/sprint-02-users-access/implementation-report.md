# Implementación - Sprint 02

Fecha: 2026-09-24
Rama: `feature/sprint-02-users-access`

## Alcance implementado

### API (`apps/api`)

- **Schema Prisma**: nuevos eventos de auditoría en `AuditEventType`
  (`USER_CREATED`, `USER_UPDATED`, `USER_ROLE_CHANGED`, `USER_DEACTIVATED`,
  `USER_ACTIVATED`). Migración:
  `prisma/migrations/20260924180000_add_user_management_audit_events`.
- **Módulo `modules/users`** con layers routes → controller → service →
  repository:
  - `GET /users` — listado con `search`, `status`, `page`, `pageSize`;
  - `GET /users/roles` — roles activos para formularios;
  - `GET /users/:id` — detalle (roles + permisos efectivos);
  - `POST /users` — crea cuenta (username/email únicos, normalize en minúsculas,
    contraseña scrypt, rol obligatorio);
  - `PUT /users/:id` — actualiza correo y nombre visible;
  - `PATCH /users/:id/role` — cambia rol (audita `fromRoleCode`/`toRoleCode`);
  - `PATCH /users/:id/status` — activa/desactiva y revoca sesiones activas.
- **Permisos**: lectura exige `users:read`; escrituras exigen `users:write`
  (`requirePermission` sobre `AuthUser`).
- **Reglas**: duplicados → `409 USER_DUPLICATE`; rol inválido →
  `400 USER_ROLE_INVALID`; inexistente → `404 USER_NOT_FOUND`; operación sobre
  cuenta propia → `409 USER_SELF_OPERATION`. Errores `P2002/P2003/P2025`
  mapeados a `AppError`.
- **Auditoría**: cada operación sensible escribe `audit_logs` dentro de la
  misma transacción.

### Frontend (`apps/web`)

- **Feature `features/users`**: tipos, servicio HTTP, hooks TanStack Query con
  invalidación, schemas Zod, tabla escritorio + móvil, toolbar de búsqueda/
  estado, modal de creación/edición y modal de cambio de rol.
- **Página `users-page.tsx`**: resumen (total, activos), estados de carga,
  error con reintento, vacío y paginación.
- **Permisos en UI**: con `users:read` se ve el módulo; las acciones de
  escritura (registrar, editar, cambiar rol, estado) se ocultan sin
  `users:write`. La cuenta propia muestra «Tú» y protege rol/estado.
- **`endpoints.users`**: objeto con `root`, `roles`, `detail`, `role`,
  `status` en lugar del string simple.

## Decisiones tomadas

1. Contraseña solo al crear la cuenta (sin reseteo admin en este sprint).
2. Protección de la cuenta propia (desactivación y cambio de rol).
3. Un rol por cuenta (coherente con el SRS).
4. Mínimo de contraseña: 8 caracteres (documentado; SRS no lo define).

## Detalles técnicos relevantes

- `username`, `email` y `displayName` se guardan en la única tabla `users`
  (sin borrado físico; RN-004/RN-041).
- Desactivar revoca `auth_sessions` activas; el login posterior devuelve 401
  y el middleware invalida la cookie.
- No se modificaron migraciones históricas; el enum de auditoría se extiende
  con `ALTER TYPE ... ADD VALUE`.
- Se reutilizan `auth.middleware` (`requireAuth`, `requirePermission`,
  `getRequestContext`), `password.hashPassword` y `databaseService.transaction`.

## Resultado de pruebas

- `apps/api/tests/users.schemas.test.ts` — 6 pruebas unitarias OK.
- `apps/api/tests/users.integration.test.ts` — integración contra PostgreSQL
  real (`DATABASE_TESTS=true`), 5/5 OK: autorización por rol, creación
  normalizada, duplicados (`409`), rol inválido (`400`), listado/búsqueda/
  filtros, detalle, actualización, cambio de rol con auditoría
  (`fromRoleCode`/`toRoleCode`), desactivación con revocación de sesiones,
  reactivación y protección de la cuenta propia (`409 USER_SELF_OPERATION`).
- `apps/api/tests/auth.integration.test.ts` — 6/6 OK con el nuevo enum:
  sin regresión sobre el Sprint 01.
- `apps/web` — schema, servicio y formulario (11 pruebas) OK.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` OK en ambos paquetes.
- `pnpm format:check` (root) y `git diff --check` OK.

## Base de datos

La migración `20260924180000_add_user_management_audit_events` fue aplicada
con `prisma migrate deploy` sobre la base PostgreSQL (Supabase) y las pruebas
de integración reales se ejecutaron con `DATABASE_TESTS=true`.

## Verificación funcional manual

Ejecutada el 2026-09-24 contra la API en ejecución (`127.0.0.1:3000`) y el
frontend dev (`5173`):

- Listado de usuarios: resumen (encontrados/activos), búsqueda, filtro por
  estado y estado vacío "No se encontraron usuarios".
- Etiqueta "Tú" en la cuenta propia con acciones de rol/estado deshabilitadas
  (protección AUTH-02).
- Creación de usuario: normalización de usuario/correo a minúsculas, contraseña
  inicial, asignación de rol y toast de éxito.
- Edición de datos (correo/nombre visible) sin contraseña ni rol (solo lectura).
- Desactivación con diálogo de confirmación (pasa a "Inactivo" y el resumen
  recalcula activos) y reactivación.
- Modal de cambio de rol mostrando el rol actual.
- Sin errores de consola (1 advertencia de HydrateFallback no relacionada).
