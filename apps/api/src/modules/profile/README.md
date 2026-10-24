# Profile (API)

Gestión segura del perfil del usuario autenticado.

## Endpoints

- `GET /api/v1/profile` — Obtiene los datos del perfil del usuario autenticado (nombre, email, usuario, roles, permisos y preferencias de notificación).
- `GET /api/v1/profile/:id` — Consulta de perfil validando que `:id` sea idéntico al usuario autenticado (403 si intenta ver perfil ajeno).
- `PUT /api/v1/profile` — Actualiza el nombre visible y las preferencias de notificación de la propia cuenta.
- `PUT /api/v1/profile/:id` — Actualiza el perfil validando que `:id` sea idéntico al usuario autenticado (403 si intenta editar perfil ajeno).
- `POST /api/v1/profile/change-password` — Cambio seguro de contraseña: exige contraseña actual válida, verifica complejidad mínima (8 caracteres) y revoca sesiones previas.

## Reglas

1. El usuario solo puede actuar sobre su propia cuenta. Intentar consultar o editar el id de otro usuario devuelve 403 Forbidden sin exponer información.
2. Cambio de contraseña exige la contraseña actual correcta. De lo contrario, se rechaza de forma segura (400 AUTH_INVALID_PASSWORD).
3. Todas las mutaciones generan eventos de auditoría (`PROFILE_UPDATED`, `PASSWORD_CHANGED`).

Sprint propietario: 18.
