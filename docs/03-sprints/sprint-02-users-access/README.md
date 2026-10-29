# Sprint 02 - Usuarios y control de acceso

Rama: `feature/sprint-02-users-access`
Base: Sprint 01 aprobado
Historias: HU-03 a HU-06
Avance acumulado al aprobar: 6/92 = 6,52%

## Objetivo

Administrar cuentas, roles y estado sin perder trazabilidad histórica.

## Historias cubiertas

- **HU-03** — Registrar usuarios y asignar un rol.
- **HU-04** — Consultar, listar y buscar usuarios (activos e inactivos).
- **HU-05** — Editar datos del usuario (correo y nombre visible).
- **HU-06** — Cambiar rol y activar/desactivar acceso con auditoría.

## Entregables

- listado, búsqueda, detalle, creación y actualización de usuarios;
- asignación de rol válido y permisos efectivos en servidor/UI;
- activación y desactivación sin borrado físico (revoca sesiones activas);
- identificador único (`username` y `email` únicos) y validaciones de entrada;
- auditoría de cambios sensibles (`USER_CREATED`, `USER_UPDATED`,
  `USER_ROLE_CHANGED`, `USER_DEACTIVATED`, `USER_ACTIVATED`);
- pruebas unitarias (schemas API y web, servicio web, formulario) y de
  integración contra PostgreSQL;
- README de `users` en frontend y API.

## Decisiones del sprint

1. **Contraseña solo al crear la cuenta.** No se ofrece cambio ni reseteo por
   el administrador en este sprint; el flujo de recuperación de accesos será
   parte de un sprint posterior (perfil/seguridad).
2. **Protección de la cuenta propia.** Un usuario no puede desactivarse a sí
   mismo ni cambiarse su propio rol. Es validado en el servidor
   (`USER_SELF_OPERATION`) y reflejado en la UI («Tú», acciones ocultas).
3. **Un rol por cuenta.** Como describe el SRS, cada usuario tiene un rol
   asignado; el modelo N:M permite el detalle futuro sin cambiar de esquema.
4. **Mínimo de contraseña: 8 caracteres.** El SRS no define longitud mínima;
   se adopta 8 en la creación del usuario (la semilla del Sprint 01 usa ≥ 12).

## Fuera de alcance

Roles configurables por interfaz, borrado de usuarios y permisos fuera de V1.0.
Cambio de la propia contraseña y reseteo admin quedan para el módulo de
perfil/seguridad.

## Verificación

- `pnpm test` — unitarias siempre; integración con `DATABASE_TESTS=true`.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm format:check`.
- `git diff --check`.
