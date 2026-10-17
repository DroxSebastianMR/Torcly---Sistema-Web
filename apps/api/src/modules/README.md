Cada dominio agrupa routes, controller, service, schema y types. Añadir repository cuando exista persistencia. No importar código de `apps/web`.

Módulos operativos actuales:

- `health`: disponibilidad de la API;
- `auth`: autenticación, sesión, permisos y auditoría;
- `users`: administración de cuentas, roles y estado, con auditoría;
- `products`: catálogo persistente protegido por permisos.

Los demás directorios documentan el límite previsto para sus sprints correspondientes.

## Instrumentación transversal (Sprint 15)

El middleware `request-timing` mide la duración de cada petición y emite
`http_request_completed` con metadatos técnicos seguros: `requestId`, `module`,
`operation`, `method`, `route` (normalizada), `status` y `durationMs`. La ruta se
normaliza en `shared/observability/normalize-route.ts` para agrupar operaciones sin
exponer UUIDs ni identificadores numéricos. Nunca se registran contraseñas, cookies,
tokens, cabeceras de autorización ni cuerpos sensibles. `metrics` recibe la carga de
módulos de la web y normaliza el `path` antes de registrarlo.
