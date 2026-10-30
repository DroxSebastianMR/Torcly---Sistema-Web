# Plan de aceptación y pruebas - Sprint 21

## Preparación

1. Iniciar sesión con `cash:read`, `cash:write`, `sales:read` y `sales:write`.
2. Aplicar la migración y ejecutar la semilla solo con autorización explícita.
3. Confirmar que no existe una sesión abierta antes de comenzar.
4. Tener al menos dos ventas confirmadas con saldo disponible.

## Casos funcionales

| ID     | Acción                                                          | Resultado esperado                                                                                    |
| ------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| S21-01 | Entrar a Caja sin sesión abierta.                               | Se explica que debe abrirse caja; cobros y compensaciones quedan bloqueados sin ocultar el historial. |
| S21-02 | Abrir caja con S/ 100.00 y una nota.                            | Se genera `CAJA-xxxxxx`, queda abierta y muestra efectivo esperado S/ 100.00.                         |
| S21-03 | Intentar abrir otra caja mientras existe una abierta.           | El servidor rechaza sin duplicar sesión.                                                              |
| S21-04 | Registrar un cobro en efectivo de S/ 30.00.                     | El pago queda vinculado a la caja, efectivo esperado pasa a S/ 130.00 y la venta actualiza saldo.     |
| S21-05 | Registrar pagos por tarjeta, transferencia y billetera digital. | Se reflejan por método pero no modifican efectivo esperado.                                           |
| S21-06 | Compensar un pago en efectivo de la caja abierta.               | Se descuenta del efectivo esperado y se mantiene auditoría de pago y compensación.                    |
| S21-07 | Intentar cobrar sin caja abierta.                               | La API rechaza la operación de forma segura; no se crea pago.                                         |
| S21-08 | Cerrar con efectivo contado igual al esperado.                  | Se cierra sin diferencia, persiste totales por método e historial.                                    |
| S21-09 | Cerrar con diferencia y sin nota.                               | La validación rechaza el cierre.                                                                      |
| S21-10 | Cerrar con diferencia y nota.                                   | Persiste diferencia, nota, responsable y fecha de cierre.                                             |
| S21-11 | Intentar cerrar dos veces o modificar una caja cerrada.         | La API rechaza ambas operaciones; la información no cambia.                                           |
| S21-12 | Abrir una nueva caja y compensar un pago de caja cerrada.       | La compensación pertenece a la caja actual; el cierre anterior sigue inmutable.                       |
| S21-13 | Consultar pagos previos a la migración.                         | Se identifican como históricos sin sesión; no se asignan artificialmente.                             |
| S21-14 | Revisar permisos, auditoría y logs.                             | Solo perfiles autorizados ven o mutan caja; logs no exponen notas ni datos sensibles.                 |
| S21-15 | Abrir el detalle de una caja cerrada desde el historial.        | Se muestran apertura, cobros, compensaciones, arqueo, diferencia y cierre sin opciones de edición.    |

## Cobertura automatizada mínima

- Schemas: monto inicial/contado, nota condicional, UUIDs, límites y `requestId`.
- Reglas: efectivo esperado, diferencia y separación por método.
- Servicio/repositorio: sesión única, concurrencia, apertura/cierre idempotente, pagos sin caja y compensación posterior.
- Integración PostgreSQL gated: índice parcial de sesión abierta, relación nullable con pagos y persistencia de auditoría.
- Web: estado sin caja, apertura, resumen, cierre, historial, permisos, estados loading/vacío/error y refresco de datos tras mutaciones.
- Calidad: typecheck, lint, test, build, format y `git diff --check`.

## Verificación de implementación

- API: generación Prisma, `typecheck`, `lint`, `prisma validate` y 412 pruebas unitarias/integración no gated correctas; 111 pruebas de integración continúan condicionadas a PostgreSQL.
- Web: `typecheck`, `lint`, build y pruebas focalizadas del servicio de sesiones de caja correctas. La suite completa conserva ejecuciones aisladas por archivo debido a pruebas de formularios heredadas que comparten entorno DOM.
- Formato: `pnpm format:check` y `git diff --check` correctos.
- Migración `20261029030000_add_cash_sessions` creada y validada estáticamente, **sin aplicar**.
