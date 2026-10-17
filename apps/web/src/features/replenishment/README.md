# Replenishment (web)

Módulo de reabastecimiento asistido: recomendaciones de compra explicables calculadas sobre la demanda confirmada (ventas y consumos de taller), corridas inmutables con auditoría y detalle histórico.

- La página consulta la elegibilidad por período y cobertura; los contadores resumen todo el período y los filtros solo acotan la tabla.
- Cada fila muestra el porqué calculado por el servidor (fórmula `net-confirmed-demand-v1`); la web nunca recalcula stock ni demanda.
- Ejecutar una corrida usa una clave de idempotencia generada en el cliente; el servidor la reutiliza si reenvías el mismo pedido y registra `REPLENISHMENT_RUN_EXECUTED` en auditoría.
- Las corridas son fotografías inmutables: el historial y su detalle (con filtros y paginación) se leen de la API sin recálculos.
- El botón de ejecución se oculta sin `inventory:write`; la consulta de la página exige `inventory:read` desde la ruta.
- No se exponen UUIDs; solo códigos de producto y de corrida (`RAB-####`).

## Experiencia (Sprint 15)

- Las tablas de recomendaciones y de corridas incluyen tarjetas responsive para
  tablet y móvil (`md:hidden`), equivalentes a la tabla de escritorio.

Sprint propietario: 14.
