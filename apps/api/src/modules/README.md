Cada dominio agrupa routes, controller, service, schema y types. Añadir repository cuando exista persistencia. No importar código de `apps/web`.

Módulos operativos actuales:

- `health`: disponibilidad de la API;
- `auth`: autenticación, sesión, permisos y auditoría;
- `users`: administración de cuentas, roles y estado, con auditoría;
- `products`: catálogo persistente protegido por permisos.

Los demás directorios documentan el límite previsto para sus sprints correspondientes.
