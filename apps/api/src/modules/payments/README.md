# Payments (API)

Módulo de cobros sobre ventas confirmadas: registra pagos, compensaciones y el historial por venta con el saldo pendiente que siempre se calcula en servidor.

- Solo las ventas `CONFIRMED` con total positivo generan obligaciones de cobro. Una venta `DRAFT`, cancelada o de total cero no aparece en el módulo ni acepta pagos.
- El saldo pendiente se deriva de datos inmutables: `total` congelado de la venta, menos el neto de pagos confirmados, más el neto de compensaciones confirmadas. Nunca se persiste un saldo editable ni se modifican el total, las líneas ni el estado de la venta.
- Se aceptan pagos parciales positivos con hasta dos decimales. Un pago nunca puede exceder el saldo pendiente y la operación corre en una transacción que toma un lock sobre la venta, de modo que los cobros concurrentes jamás sobrepagan.
- Métodos de pago: `CASH`, `CARD`, `TRANSFER` y `DIGITAL_WALLET`, estables en la base y con etiqueta en español en la interfaz.
- Un pago confirmado es inmutable: no se actualiza ni elimina. La única corrección es una compensación ligada al pago original, con motivo obligatorio, que restaura saldo y queda auditada en el historial.
- Los estados de cobro `PENDING`, `PARTIALLY_PAID` y `PAID` son derivados de consulta y no reemplazan el estado `CONFIRMED` de la venta.
- El registro de un pago o una compensación nunca crea ni cancela movimientos de inventario.
- El historial por venta ofrece pagos y compensaciones con importe neto, método, responsable, motivo y referencia al evento original; los montos se serializan como `number` igual que en ventas.
- `POST /api/v1/payments/:id/pay` es idempotente por `requestId` (UUID obligatorio): reintentar la misma operación no genera un segundo cobro. La compensación es idempotente del mismo modo.
- El código legible se genera con la secuencia `payments_code_seq` como `PAGO-000001` o `COMP-000001`.
- Solo lectura con `cash:read` y `sales:read`; registrar pagos y compensaciones exige `cash:write` y `sales:write`. Cada cobro y compensación deja auditoría con actor, venta, importe, método, `requestId` y referencia al evento original.

Sprint propietario: 11.
