# Mapa de operaciones críticas - HU-91

Documenta, por módulo, cómo se preservan la consistencia, el rollback, la
idempotencia y la concurrencia. No describe una certificación: recoge lo que el
código ya implementa y la prueba automatizada que lo respalda.

## Cómo se verifica

- Las pruebas de integración están marcadas con `describe.runIf(DATABASE_TESTS === 'true')`.
- Ejecución real (requiere PostgreSQL descartable):
  `DATABASE_TESTS=true pnpm --filter @torcly/api test`
- Sin `DATABASE_TESTS=true` las integraciones se omiten; las unitarias siguen
  verdes. Nunca se apunta a producción.

## Invariantes transversales

- **Transacción**: cada mutación abre `databaseService.transaction` (Prisma
  `$transaction`). Si una excepción sale del callback, Prisma revierte todo el
  bloque: no quedan movimientos, líneas ni auditoría parciales.
- **Serialización**: la concurrencia se resuelve con
  `pg_advisory_xact_lock(hashtext(...))` (se libera al terminar la transacción),
  no con estado en memoria.
- **Idempotencia**: claves `idempotencyKey` con `@unique` en base de datos; un
  reintento con la misma clave devuelve el registro existente o detecta
  conflicto, sin duplicar efectos.
- **Auditoría**: cada mutación escribe un `AuditLog` en la misma transacción con
  actor, evento, `requestId` y contexto mínimo (sin secretos).

## Operaciones por módulo

| Módulo           | Operación                 | Transacción                | Bloqueo (advisory)                                             | Idempotencia                                                                               | Evento de auditoría                               | Prueba de integración                                                                                    |
| ---------------- | ------------------------- | -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Inventario       | Entrada / salida / ajuste | `registerMovement`         | `torcly:inventory:{productId}`                                 | `InventoryMovement.idempotencyKey` (`@unique`)                                             | `INVENTORY_*`                                     | `inventory.integration.test.ts` (idempotencia y "no supera el stock bajo salidas concurrentes")          |
| Ventas           | Confirmar venta           | `confirmSale`              | `torcly:sale:{saleId}` + `torcly:inventory:{productId}`        | Retorno temprano si ya está `CONFIRMED` + salidas `sale-exit:{id}:{productId}` (`@unique`) | `SALE_CONFIRMED` + `INVENTORY_EXIT_REGISTERED`    | `sales.integration.test.ts` (confirma repetidamente sin duplicar; rechaza sin stock sin generar salidas) |
| Pagos            | Registrar cobro           | `payment.repository`       | `pg_advisory_xact_lock` sobre `torcly:sale:{saleId}`           | `Payment.idempotencyKey` `payment:{saleId}:{requestId}`                                    | `PAYMENT_REGISTERED`                              | `payments.integration.test.ts` (idempotente por `requestId`; no supera saldo bajo cobros concurrentes)   |
| Pagos            | Compensar cobro           | `payment.repository`       | sobre la venta                                                 | `payment-compensation:{paymentId}:{requestId}`                                             | `PAYMENT_COMPENSATED`                             | `payments.integration.test.ts`                                                                           |
| Taller           | Consumir repuestos        | `work-order.repository`    | `torcly:work-order:{orderId}` + `torcly:inventory:{productId}` | `WorkOrderConsumption.idempotencyKey`                                                      | `WORK_ORDER_PRODUCT_CONSUMED`                     | `work-order.integration.test.ts` (consumo con idempotencia; rechaza sin stock y sobre presupuesto)       |
| Taller           | Devolver repuestos        | `work-order.repository`    | sobre la orden y el producto                                   | estado neto consumido                                                                      | `WORK_ORDER_PRODUCT_RETURNED`                     | `work-order.integration.test.ts` (compensa el inventario; rechaza devolver de más)                       |
| Citas            | Crear/reagendar           | `appointment.repository`   | `torcly:appointment:slot:{fecha}:{hora}`                       | estado de cita                                                                             | `APPOINTMENT_CREATED` / `APPOINTMENT_RESCHEDULED` | `appointment.integration.test.ts`                                                                        |
| Taller           | Atender cita              | `work-order.repository`    | `torcly:appointment:{appointmentId}`                           | cita→orden única (`appointmentId @unique`)                                                 | `WORK_ORDER_CREATED`                              | `work-order.integration.test.ts` (atiende una cita generando una única OT; rechaza cita cancelada)       |
| Reabastecimiento | Ejecutar corrida          | `replenishment.repository` | `torcly:replenishment:runs`                                    | `ReplenishmentRun.idempotencyKey`                                                          | `REPLENISHMENT_RUN_EXECUTED`                      | `replenishment.integration.test.ts` (reintenta con idempotencia sin duplicar corridas)                   |

## Rollback

- Si la validación falla después de abrir la transacción (por ejemplo, stock
  insuficiente en la confirmación de venta o en el consumo de taller), la
  operación lanza `AppError` y Prisma revierte: no se crean movimientos de
  inventario ni registros de auditoría.
- Evidencia: "rechaza confirmar cuando el stock no alcanza y no genera salidas"
  (ventas), "rechaza consumo sin stock suficiente" (taller), "rechaza consumir
  por encima del presupuesto" (taller).

## Reintento

- Reintentar una mutación con la misma clave devuelve el resultado existente sin
  volver a aplicar el efecto (movimiento, cobro o corrida).
- Un reintento con la misma clave pero distinto objetivo produce conflicto
  explícito (`INVENTORY_IDEMPOTENCY_CONFLICT`) en lugar de corromper datos.

## Concurrencia

- Las solicitudes simultáneas sobre el mismo recurso se serializan con el lock
  por recurso; la segunda reevalúa el estado ya confirmado.
- Evidencia: "no supera el saldo bajo cobros concurrentes" (pagos), "serializa
  salidas concurrentes" (inventario).

## Límites

- El lock es por transacción; no hay coordinación distribuida entre nodos, pero
  PostgreSQL garantiza exclusión mutua entre conexiones.
- Las corridas de reabastecimiento son de solo lectura sobre el stock confirmado
  y no crean movimientos ni compras al recomendar (verificado en integración).
