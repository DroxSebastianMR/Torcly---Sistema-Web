# Health (API)

Expone el estado del servicio y su preparación para operar, sin revelar detalles internos.

- `GET /health` responde `{ status: 'ok', service, timestamp }` para verificación de vida.
- `GET /health/database` verifica la conexión a PostgreSQL y reporta latencia.
- `GET /health/readiness` responde `200` cuando la dependencia responde y `503 degraded` cuando no, usando solo el estado de los chequeos (nunca la cadena de conexión, usuario, host ni el error interno).

La respuesta de readiness se construye con `buildReadiness` (función pura y testeable); `getReadiness` resuelve el chequeo de base de datos. No afirma un SLA de disponibilidad: la meta mensual del 98 % requiere fuente externa, período y cálculo documentado. Sprint propietario: 16 (HU-83).
