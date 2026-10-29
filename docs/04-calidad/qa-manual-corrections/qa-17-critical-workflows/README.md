# QA-17 - Correcciones de flujos críticos

Rama: `feature/qa-manual-corrections`  
Estado: Implementado; validación manual y PostgreSQL pendientes  
Origen: QA-05, QA-06 y QA-07 de la prueba manual.

## Objetivo

Corregir o reproducir con evidencia los flujos que afectan citas, ejecución de
órdenes y cobros, sin alterar reglas de negocio, stock, saldos, locks ni
idempotencia.

## Alcance

| ID    | Entrega                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------ |
| QA-05 | Demostrar y, si procede, corregir el límite real de ocho citas activas por mismo slot.                       |
| QA-06 | Explicar el selector de repuestos vacío y comprobar consumo/devolución sobre una línea de producto aprobada. |
| QA-07 | Permitir escribir y conservar importes monetarios como `100.00` antes de validar el pago.                    |

## Límites

- La API mantiene capacidad de ocho, lock por slot y prohibición de dos citas
  activas para el mismo vehículo y horario.
- Un consumo usa solo una línea de producto aprobada y pendiente; una devolución
  exige un consumo previo.
- Saldo, estado de cobro, idempotencia y `requestId` siguen siendo autoridad del
  servidor.

Usar [implementation-prompt.md](implementation-prompt.md) para implementar y
[acceptance-and-test-plan.md](acceptance-and-test-plan.md) para verificar.

## Resultados

### Causa y corrección

- **QA-05**: la regla ya existía: capacidad de 8 citas `PROGRAMADA` por slot con
  advisory lock y rechazo `409 APPOINTMENT_SLOT_FULL`. No se modificó la regla.
  Se añadió una regresión con nueve vehículos distintos y un test unitario del
  repository que verifica el lock antes del conteo, el rechazo de la novena y el
  alta con fecha/hora normalizadas más auditoría.
- **QA-06**: el selector vacío era el estado esperado, pero el texto no lo
  explicaba. Se actualizaron los mensajes de consumo y devolución para indicar
  que solo aparecen líneas del presupuesto aprobado pendientes de consumir o
  consumidas sin devolver. No se cambió la lógica de stock.
- **QA-07**: el importe se manejaba como número y `type="number"`, por lo que
  `100.00` se convertía en cada pulsación (`100.` → `100`). Ahora el formulario
  conserva el texto, acepta hasta dos decimales, normaliza a `100.00` al salir y
  convierte a número al confirmar. La API sigue validando saldo, máximo de dos
  decimales, idempotencia y `requestId`.

### Archivos

- `apps/api/tests/appointment.integration.test.ts`
- `apps/api/tests/appointment.repository.test.ts`
- `apps/web/src/features/work-orders/components/work-order-consumption-modal.tsx`
- `apps/web/src/features/work-orders/components/work-order-return-modal.tsx`
- `apps/web/src/features/work-orders/components/work-order-consumption-modal.test.tsx`
- `apps/web/src/features/work-orders/components/work-order-return-modal.test.tsx`
- `apps/web/src/features/cash/forms/payment.schema.ts`
- `apps/web/src/features/cash/forms/payment.schema.test.ts`
- `apps/web/src/features/cash/components/payment-form-modal.tsx`
- `apps/web/src/features/cash/components/compensation-form-modal.tsx`
- `apps/web/src/features/cash/components/payment-form-modal.test.tsx`
- `apps/web/src/features/cash/components/compensation-form-modal.test.tsx`

### Comandos y resultados

| Comando                               | Resultado                                                         |
| ------------------------------------- | ----------------------------------------------------------------- |
| `pnpm --filter @torcly/api typecheck` | Correcto                                                          |
| `pnpm --filter @torcly/api lint`      | Correcto                                                          |
| `pnpm --filter @torcly/api test`      | 306 aprobadas; 109 integraciones omitidas por no tener PostgreSQL |
| `pnpm --filter @torcly/web typecheck` | Correcto                                                          |
| `pnpm --filter @torcly/web lint`      | Correcto                                                          |
| `pnpm --filter @torcly/web test`      | 371 aprobadas (78 archivos)                                       |
| `pnpm --filter @torcly/web build`     | Correcto; solo advertencia de tamaño de chunk                     |
| `pnpm format:check`                   | Correcto                                                          |
| `git diff --check`                    | Correcto                                                          |

### Pendientes

- Ejecutar `appointment.integration.test.ts` y los flujos QA-06/QA-07 contra una
  PostgreSQL descartable con `DATABASE_TESTS=true`; no se simula esa ejecución.
- Validación manual en navegador de los tres casos con evidencia y capturas.
- La ejecución deja los cambios sin commit ni push, según el alcance.
