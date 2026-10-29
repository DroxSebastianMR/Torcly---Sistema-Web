# Audit (web)

Consulta administrativa del registro de auditoría.

- La página `/auditoria` (permiso `audit:read`) lista los eventos con fecha, evento, actor, identificador, IP y `requestId`, sin exponer tokens, hashes ni metadata sensible.
- Filtra por evento (lista de eventos relevantes de seguridad y administración) e identificador; la paginación es estable (página anterior/siguiente) y refleja `total`/`totalPages` de la API.
- Si la API responde `403`, el guard de permisos y el estado de error evitan mostrar datos; no se representan resultados vacíos como cero.
- El componente es de solo lectura; no ofrece mutaciones sobre la auditoría.

Sprint propietario: 16 (HU-87).
