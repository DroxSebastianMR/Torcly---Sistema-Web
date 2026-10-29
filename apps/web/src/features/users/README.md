# Users (web)

Administra cuentas, rol y estado de acceso de las personas con entrada al
sistema. Lista, busca y filtra usuarios; crea accesos; edita datos permitidos;
cambia el rol por cuenta y activa o desactiva el acceso revocando sesiones.

## Estructura

- `pages/users-page.tsx` — página con cabecera, resumen, filtros, tabla,
  paginación y modales.
- `components/users-table.tsx` — tabla escritorio + tarjetas móviles.
- `components/users-toolbar.tsx` — búsqueda y filtro por estado.
- `components/user-form-modal.tsx` — creación y edición de datos.
- `components/user-role-modal.tsx` — cambio de rol por cuenta.
- `hooks/use-users.ts` — queries TanStack Query y mutaciones con invalidación.
- `services/users.service.ts` — llamadas HTTP a `/users`.
- `forms/users.schema.ts` — schemas Zod compartidos (crear y perfil).
- `types/users.types.ts` — contratos del feature.
- `utils/user-formatters.ts` — mensajes de error y formato de fechas.

## Comportamiento

- Solo lectura con `users:read`; operaciones de escritura con `users:write`.
  El servidor valida siempre; la UI solo oculta acciones sin permiso.
- La contraseña se asigna solo al crear la cuenta; no se puede editar luego.
- El rol se cambia en un modal propio con confirmación y epidemia de auditoría.
- La cuenta propia se protege: su fila muestra «Tú» y no permite cambiarle el
  rol ni desactivarla (decisión de diseño del Sprint 02; el servidor también
  responde `USER_SELF_OPERATION`).
- Desactivar una cuenta revoca sus sesiones activas; reactivarla restaura el
  acceso normal.

## Integración

- `endpoints.users` en `infrastructure/api/endpoints.ts`.
- `useAuth().user` aporta `id` y permisos del usuario actual en sesión.
- `hasPermission(permissions, 'users:write')` decide qué acciones se muestran.

Depende de auth y permisos. No borra usuarios ni concede permisos que el
servidor no valide. Sprint propietario: 02.
