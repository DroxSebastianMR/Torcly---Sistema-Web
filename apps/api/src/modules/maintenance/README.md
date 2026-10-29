# Maintenance (API)

Comunica mantenimiento planificado sin falsificar disponibilidad.

- `GET /maintenance` (público) devuelve `{ generatedAt, window }` con la ventana activa o la próxima programada, o `null`. Solo expone identificador, rango, mensaje y estado (`scheduled`, `active`, `past`). Responde con `Cache-Control: no-store`.
- `GET /maintenance/windows` (sesión + `maintenance:read`) lista las ventanas para administración, con `createdBy` y `createdAt`.
- `POST /maintenance/windows` (sesión + `maintenance:write`) programa una ventana; valida que el fin sea posterior al inicio y registra auditoría `MAINTENANCE_SCHEDULED`.
- `DELETE /maintenance/windows/:id` (sesión + `maintenance:write`) cancela una ventana; registra `MAINTENANCE_CANCELLED` y devuelve `404 MAINTENANCE_NOT_FOUND` si no existe.

Programar una ventana no bloquea el servicio por sí solo: es una señal para la UI. Sprints propietarios: 16 (HU-83).
