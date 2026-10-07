# Guía manual — Sprint 11: Cobros, saldos e historial de pagos

Esta guía permite demostrar HU-37 a HU-41 en una base de desarrollo con las migraciones y la semilla ya aplicadas.

## Preparación

1. Desde la raíz del proyecto, inicia los servicios con `pnpm dev`.
2. Abre `http://127.0.0.1:5173` e inicia sesión con el usuario administrador configurado en las variables de semilla.
3. Si no hay una venta confirmada disponible, ve a **Ventas**, crea una venta con al menos un producto o servicio y pulsa **Confirmar venta**. Conserva su código y total.
4. En la barra lateral, abre **Caja**. La venta confirmada debe aparecer como `Pendiente` con un saldo igual a su total.

## 1. Consultar obligaciones pendientes

1. Verifica los indicadores superiores: ventas pendientes, saldo pendiente y cobrado en el período.
2. Busca la venta por su código, nombre de cliente o documento.
3. Prueba los filtros de estado, método y período; al limpiarlos, la venta debe volver a aparecer si sigue pendiente.
4. Abre el detalle de la venta y comprueba que total pagado es `S/ 0.00`, el saldo coincide con el total y el historial está vacío.

Resultado esperado: solo se muestran ventas confirmadas con total positivo; una venta en borrador no aparece como obligación cobrable.

## 2. Registrar un pago parcial

1. Desde el detalle, pulsa **Registrar pago**.
2. Ingresa un importe positivo menor que el saldo, por ejemplo, la mitad del total.
3. Elige un método (efectivo, tarjeta, transferencia o billetera digital), agrega una observación opcional y confirma.
4. Reabre o revisa el detalle.

Resultado esperado: se agrega un evento al historial con usuario, fecha, método e importe; el estado cambia a `Parcialmente pagada` y el saldo disminuye exactamente por el importe ingresado. La venta mantiene su estado comercial `Confirmada`.

## 3. Completar el cobro

1. Pulsa nuevamente **Registrar pago**.
2. Ingresa exactamente el saldo visible y confirma.
3. Revisa la fila y el detalle de la venta.

Resultado esperado: saldo `S/ 0.00`, estado `Pagada` y dos eventos de pago en el historial. Ya no debe ofrecerse registrar un pago adicional para esa venta.

## 4. Comprobar validaciones

Usa otra venta confirmada pendiente o la misma antes de completar el paso 3.

1. Intenta registrar `0`, un importe negativo o texto no numérico.
2. Intenta registrar un importe mayor al saldo mostrado.
3. Intenta abrir la caja con una venta en borrador, si hay una disponible.

Resultado esperado: el formulario no permite importes no positivos; el servidor rechaza cualquier sobrepago; las ventas no confirmadas no se pueden cobrar.

## 5. Compensar un pago

1. Abre el detalle de una venta pagada o parcialmente pagada.
2. En el evento de pago, pulsa **Compensar**.
3. Ingresa un importe positivo que no supere al pago original y un motivo obligatorio; confirma.
4. Comprueba nuevamente el resumen y el historial.

Resultado esperado: el pago original sigue visible e inmutable; aparece una compensación enlazada con su motivo, el saldo aumenta por el importe compensado y el estado de cobro se recalcula. La operación no edita ni borra el pago original.

## 6. Verificar que no se altera inventario

1. Anota el stock de un producto usado por la venta en **Inventario**.
2. Registra un pago y, si corresponde, una compensación.
3. Vuelve a **Inventario** y consulta el historial del producto.

Resultado esperado: no se crea ningún movimiento de inventario por pagar o compensar una venta; el stock permanece igual.

## Criterio de aprobación

La prueba queda lista para aprobar cuando los seis apartados se completen sin bloqueos, los saldos concilien con los eventos del historial y no se detecten pagos duplicados, sobrepagos ni efectos en inventario. Registra entonces el resultado y la aprobación expresa en `approval.md`.
