# Plan de aceptación - Sprint 11 Cobros, saldos e historial de pagos

## Estado

Listo para prueba manual. Implementación, pruebas automatizadas, typecheck, lint, build, formato y `git diff --check` en verde. Las migraciones y la semilla ya fueron aplicadas en la base de desarrollo el 07 oct. 2026.

## Preparación

1. Iniciar sesión con un usuario que tenga `cash:read`, `cash:write`, `sales:read` y `sales:write`.
2. Contar con una venta `CONFIRMED` con cliente, total positivo y sin pagos previos; por ejemplo, total S/ 300.00.
3. Anotar el total y confirmar que el inventario ya fue descontado por la venta antes de registrar un pago.

## Casos principales

| Caso             | Acción                                                                                                   | Resultado esperado                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Elegibilidad     | Intentar abrir el registro de pago de una venta `DRAFT`.                                                 | La API y la interfaz rechazan la operación; solo se cobra una venta confirmada.                       |
| Pago parcial     | Registrar S/ 100.00 sobre una venta confirmada de S/ 300.00.                                             | Se crea un pago inmutable; pagado S/ 100.00, saldo S/ 200.00 y estado parcial.                        |
| Pago total       | Registrar S/ 200.00 adicional.                                                                           | Saldo S/ 0.00, estado pagada e historial con dos pagos.                                               |
| Límite de saldo  | Intentar registrar S/ 0.01 cuando el saldo es cero o S/ 301.00 antes de pagar.                           | Se rechaza sin crear pago ni alterar saldo.                                                           |
| Importe inválido | Enviar 0, negativo, más de dos decimales o un método no permitido.                                       | Validación cliente y servidor; no se persiste nada.                                                   |
| Idempotencia     | Reenviar el mismo `requestId` de pago o emitir dos solicitudes concurrentes por el saldo restante.       | Se conserva un único pago por solicitud y nunca se supera el saldo.                                   |
| Historial        | Abrir el detalle de la venta y el listado de pagos.                                                      | Se muestran código, método, importe, fecha, actor, total pagado y saldo.                              |
| Consulta         | Buscar por código de venta, cliente/documento; filtrar por pendiente, parcial, pagada, método y período. | Solo se muestran obligaciones compatibles con los filtros y la paginación.                            |
| Compensación     | Revertir un pago de prueba con el flujo autorizado.                                                      | El pago original permanece visible y se crea un evento compensatorio auditado; el saldo se recalcula. |
| Inmutabilidad    | Intentar editar o eliminar un pago confirmado.                                                           | La UI no ofrece acción y la API la rechaza.                                                           |
| Inventario       | Comparar existencias antes y después del pago.                                                           | No se crean ni modifican movimientos de inventario.                                                   |
| Permisos         | Probar con usuario de solo lectura y sin permiso de caja.                                                | Consulta según permiso; ninguna mutación sin `cash:write`.                                            |

## Evidencia mínima

- Venta pendiente, parcialmente pagada y pagada.
- Dos pagos parciales, intento de sobrepago rechazado y reintento idempotente.
- Una compensación/reversión que mantenga visible el pago original.
- Historial de la venta con actor, método, importe y saldo recalculado.
- Inventario sin cambios causados por pagos.
- Resultado de migraciones, pruebas automatizadas, typecheck, lint, build, formato y `git diff --check`.
