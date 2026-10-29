# Replenishment (API)

Recomendaciones asistidas de reabastecimiento: calcula, con datos ya confirmados, qué productos conviene reponer, cuánto y por qué. Es determinista y explicable (v1, sin LLM) y solo propone: nunca crea compras, entradas, ajustes ni movimientos.

- Rutas bajo `/api/v1/replenishment`, con sesión activa. `GET` exige `inventory:read`; `POST /runs` exige `inventory:write`.
- `GET /replenishment/eligibility?from&to&coverageDays&search&priority&eligible&page&pageSize` devuelve la corrida en vivo (no persiste): período, versión de estrategia, conteos y la página de recomendaciones.
- `POST /replenishment/runs` cuerpo `{ from?, to?, coverageDays?, idempotencyKey? }` ejecuta la corrida y la guarda de forma inmutable; responde `201` con el resumen creado y `200` si la clave de idempotencia repite una corrida ya ejecutada.
- `GET /replenishment/runs?from&to&page&pageSize` lista el historial de corridas; `GET /replenishment/runs/:code?search&priority&eligible&page&pageSize` devuelve el detalle persistido. El historial nunca se recalcula.
- Período siempre resuelto en servidor: si falta, últimos 30 días hasta hoy; rango invertido → `400 REPLENISHMENT_DATE_RANGE_INVALID`. `coverageDays` entero entre 1 y 365, por defecto 30 (`400 REPLENISHMENT_COVERAGE_INVALID`). Corrida inexistente → `404 REPLENISHMENT_RUN_NOT_FOUND`.
- Fuentes de demanda (sin doble conteo), solo en el período: líneas `PRODUCT` de ventas `CONFIRMED` por `confirmedAt` + consumos `CONSUMPTION` del período con `movement.status = CONFIRMED`. Stock = `computeStock` sobre movimientos `CONFIRMED` (misma regla que inventario). Cada producto aporta `demandQuantity` y `demandPoints`.
- Fórmula v1 (`net-confirmed-demand-v1`): elegible si está activo y `demandPoints >= 3` (si no: `INACTIVE_PRODUCT` o `INSUFFICIENT_DATA`, sin cantidad). `dailyDemand = demanda ÷ días` (6 dec), `targetStock = dailyDemand × cobertura` (3 dec), `suggestedQuantity = techo(targetStock − stock)` (unidades enteras, nunca negativa), `currentCoverageDays = stock ÷ dailyDemand` (1 dec). Prioridad: `CRITICA` si stock ≤ mínimo, `ALTA` si cubre menos de la mitad de la cobertura, `MEDIA` si hay sugerencia y `BAJA` si no la hay. Cada fila expone los insumos, el resultado y una explicación en español que repite la cuenta con sus redondeos.
- Orden determinista: elegibles primero, prioridad, sugerido desc y nombre asc; el orden persiste en `sortOrder` para que el detalle sea reproducible. Los productos sin demanda se muestran con explicación, nunca como cero engañoso.
- La corrida se crea en una transacción con `pg_advisory_xact_lock` y clave de idempotencia opcional única; escribe las recomendaciones con `createMany` y un `AuditLog` (`REPLENISHMENT_RUN_EXECUTED`). Nunca modifica stock ni catálogos.
- Los UUIDs no se exponen: la corrida se identifica por su código `RAB-######` (secuencia `replenishment_runs_code_seq`).

Sprint propietario: 14.
