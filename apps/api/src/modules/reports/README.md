# Reports (API)

Módulo de solo lectura con indicadores históricos y trazables para ventas, cobros, inventario, servicios y taller. BI consume datos reales de los módulos fuente; no los corrige, completa ni modifica.

- Rutas bajo `/api/v1/reports`, protegidas con sesión activa y permiso `reports:read`. Cada bloque exige además los permisos de lectura de su fuente.
- `GET /reports/summary?from&to` devuelve el período resuelto y los descriptores de los bloques autorizados, sin datos.
- `GET /reports/blocks/:block?from&to` devuelve el detalle de un bloque: descriptor (fuente, período, estados y criterio), métricas, serie temporal y tablas de desglose.
- El período siempre se resuelve en servidor: si falta, se usa los últimos 30 días hasta hoy. Un rango invertido se rechaza con `400 REPORTS_DATE_RANGE_INVALID`.
- Granularidad de la serie: diaria (hasta 31 días), semanal (hasta 186) y mensual en adelante. Cada punto expone `bucket`, `label`, `count` y `amount`.
- Bloques y permisos: `sales` (ventas `CONFIRMED` por `confirmedAt`) con `sales:read`; `payments` (pagos y compensaciones por `occurredAt`, saldo pendiente como instantánea) con `cash:read` + `sales:read`; `inventory` (movimientos `CONFIRMED` por `occurredAt` y stock bajo como instantánea) con `inventory:read`; `services` (líneas `SERVICE` de ventas confirmadas) con `sales:read` + `services:read`; `workshop` (órdenes por `createdAt`, entregas por `deliveredAt` y citas por `date`) con `workshop:read` + `appointments:read`.
- Los saldos reutilizan `payment.rules.ts` (`computePaidAmount`, `computeBalance`, `collectionStatusFromBalance`); el stock reutiliza `inventory.rules.ts` (`computeStock`) y el stock bajo la misma consulta que la consulta operativa. No se recalculan con reglas paralelas.
- Los bloques no autorizados se omiten del resumen y se rechazan con `403 REPORTS_BLOCK_FORBIDDEN`; nunca se representan como cero. No se exponen UUIDs.
- Es solo lectura: no registra movimientos, pagos, ventas, citas ni órdenes.

Sprint propietario: 13.
