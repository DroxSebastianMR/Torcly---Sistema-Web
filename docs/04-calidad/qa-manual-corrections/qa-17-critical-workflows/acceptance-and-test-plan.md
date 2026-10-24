# Plan de aceptación - QA-17 Flujos críticos

## QA-05 - Capacidad de citas

1. Preparar nueve vehículos distintos y usar una misma fecha futura y hora.
2. Crear ocho citas `PROGRAMADA`; intentar la novena en el mismo slot.
3. Cancelar una de las ocho y reintentar la novena.

Esperado: ocho aceptadas, novena rechazada por capacidad, y cancelación libera
un solo cupo. Registrar slot exacto, HTTP y `requestId` sin datos sensibles.

## QA-06 - Consumo y devolución

1. Registrar producto con stock y añadirlo a un presupuesto de orden.
2. Enviar y aprobar el presupuesto; iniciar la ejecución.
3. Consumir parcialmente el producto y devolver una parte.

Esperado: el producto aparece como pendiente; consumo crea `EXIT`; devolución
crea `ADJUSTMENT_IN`; no hay duplicados ni stock negativo.

## QA-07 - Pago parcial

1. Abrir una venta confirmada con saldo suficiente en Caja.
2. Reemplazar el importe por `100.00`, elegir método y registrar.
3. Probar importe cero, negativo y superior al saldo.

Esperado: el valor escrito permanece durante edición, el pago parcial persiste y
el saldo cambia; valores inválidos no crean movimientos.

Ejecutar API typecheck/lint/test; web typecheck/lint/test/build;
`pnpm format:check` y `git diff --check`.
