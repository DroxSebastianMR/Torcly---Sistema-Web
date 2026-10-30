# Sprint 21 - Apertura y cierre semanal de caja

Rama objetivo: `feature/sprint-21-cash-sessions`
Base técnica: Sprint 20 integrado.
Estado: **Listo para prueba del usuario.**

## Objetivo

Extender el módulo actual de Cobros con sesiones de caja manuales. Una sesión representa el período operativo real de la encargada —normalmente semanal—, desde su apertura con efectivo inicial hasta su cierre con arqueo y diferencia documentada.

Los cobros ya existentes se conservan. La ampliación no modifica ventas, precios, líneas ni inventario.

## Decisiones funcionales

1. Solo puede existir **una sesión abierta** a la vez.
2. La apertura es manual; no depende del lunes, de una hora fija ni de tareas programadas. La encargada puede abrir la caja el día en que empiece a operar.
3. Para registrar un nuevo pago o compensación debe existir una sesión abierta. La interfaz explicará cómo abrirla cuando falte.
4. Todos los métodos de pago se asocian a la sesión abierta, pero el arqueo físico usa únicamente efectivo:
   `efectivo esperado = monto inicial + cobros CASH - compensaciones CASH`.
5. Tarjeta, transferencia y billetera digital se muestran separados como totales informativos y no alteran el efectivo esperado.
6. El cierre es manual. Puede ejecutarse semanalmente o cuando la encargada decida terminar el período operativo.
7. Cerrar requiere declarar el efectivo contado. Si hay diferencia, exige una observación de al menos 3 caracteres.
8. Una sesión cerrada es inmutable: no se reabre ni se edita en este sprint.
9. Las compensaciones de pagos de una caja cerrada se registrarán únicamente en la sesión abierta actual; no reescriben el cierre histórico anterior. Si no hay sesión abierta, se rechazan.
10. Los pagos históricos previos a Sprint 21 quedan sin sesión (`cashSessionId = null`) y se identifican como registros históricos, sin inventar una apertura anterior.

## Alcance

- Apertura manual con monto inicial positivo o cero y nota opcional.
- Consulta de la sesión abierta: período, responsable, efectivo esperado y totales por método.
- Vinculación de pagos y compensaciones nuevos a la sesión abierta.
- Cierre con efectivo contado, diferencia, nota condicional y resumen congelado.
- Historial paginado de cierres y consulta de detalle inmutable por cada caja.
- Auditoría de apertura y cierre; idempotencia, transacciones y locks para operaciones críticas.
- Nueva experiencia de Caja: vista **Caja actual**, **Cobros** e **Historial de cierres**.
- Estados de carga, vacío, restricción y error, con permisos `cash:read` y `cash:write`.

## Fuera de alcance

- Aperturas o cierres automáticos por calendario.
- Retiros, fondos, gastos, depósitos, caja chica, conciliación bancaria o comprobantes fiscales.
- Edición, reapertura o eliminación de sesiones cerradas.
- Cambio de ventas confirmadas, pagos históricos o inventario.
- Múltiples sucursales/cajas simultáneas: el sistema actual opera un único punto de caja.

## Reglas no negociables

1. El servidor calcula todos los montos; el cliente nunca determina efectivo esperado ni diferencia final.
2. La restricción de una caja abierta se impone en base de datos y servicio, no solo en la web.
3. Apertura, cierre, pago y compensación son transaccionales, auditables e idempotentes mediante `requestId`.
4. El cierre bloquea la sesión mientras calcula totales y persiste el arqueo para evitar cierres concurrentes.
5. Una sesión cerrada jamás cambia como resultado de una compensación posterior.
6. La información histórica no se inventa ni se migra como si hubiese pertenecido a una caja real.
7. Los logs no exponen notas internas, IP, montos contados ni datos personales innecesarios.

## Modelo de datos propuesto

### CashSession

| Campo                    | Regla                                   |
| ------------------------ | --------------------------------------- |
| `id`                     | UUID interno                            |
| `code`                   | Consecutivo visible `CAJA-000001`       |
| `status`                 | `OPEN` o `CLOSED`                       |
| `openingAmount`          | Efectivo inicial, >= 0                  |
| `openingNotes`           | Opcional, máximo 300 caracteres         |
| `openedAt`, `openedBy`   | Trazabilidad de apertura                |
| `expectedCashAmount`     | Calculado y congelado al cierre         |
| `countedCashAmount`      | Declarado al cierre                     |
| `differenceAmount`       | `contado - esperado`                    |
| `closingNotes`           | Obligatoria si la diferencia no es cero |
| `closedAt`, `closedBy`   | Trazabilidad de cierre                  |
| `createdAt`, `updatedAt` | Trazabilidad temporal                   |

### Payment

Se agrega `cashSessionId` nullable. Los pagos y compensaciones creados con caja abierta almacenan la sesión vigente. Los registros previos permanecen `null`.

## API prevista

| Método | Ruta                              | Propósito                                           |
| ------ | --------------------------------- | --------------------------------------------------- |
| `GET`  | `/api/v1/cash-sessions/current`   | Caja abierta y resumen actual; `null` si no existe. |
| `POST` | `/api/v1/cash-sessions/open`      | Abrir caja con monto inicial.                       |
| `POST` | `/api/v1/cash-sessions/:id/close` | Cerrar y registrar arqueo.                          |
| `GET`  | `/api/v1/cash-sessions`           | Historial paginado de cierres.                      |
| `GET`  | `/api/v1/cash-sessions/:id`       | Detalle inmutable de una sesión.                    |

Las rutas de pago existentes permanecen. Internamente exigen caja abierta antes de crear `PAYMENT` o `COMPENSATION`.

## Migración

1. Crear enum `CashSessionStatus`, tabla `cash_sessions`, secuencia de código e índices de consulta.
2. Añadir `payments.cash_session_id` nullable e índice compuesto por sesión, método y fecha.
3. Crear un índice único parcial en PostgreSQL para impedir más de una sesión `OPEN`.
4. No poblar pagos anteriores: permanecen como historial sin sesión.
5. Añadir eventos `CASH_SESSION_OPENED` y `CASH_SESSION_CLOSED` a auditoría.

No aplicar migraciones ni seed sin autorización expresa.

## Criterio de cierre del sprint

La implementación estará lista para prueba cuando las verificaciones automatizadas estén en verde y el acta quede en **Listo para prueba del usuario**. La aprobación requiere ejecutar el plan manual y la confirmación expresa del responsable.
