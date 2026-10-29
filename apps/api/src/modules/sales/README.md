# Sales (API)

Gestiona ventas de productos y servicios en dos estados: borrador y confirmada.

- Una venta inicia como **borrador** y suele quedar asociada a un cliente opcional.
- Solo se agregan **productos activos con stock** y **servicios activos**.
- Cada línea conserva una copia del nombre, código, unidad y precio al momento de guardarse (precios congelados).
- Confirmar una venta directa valida el stock en servidor y genera **salidas de inventario exactas** por producto en la misma transacción. Las ventas generadas desde una orden de taller ya entregada conservan sus líneas como comprobante de cobro y no generan una segunda salida: el consumo de la orden es el único movimiento de inventario.
- Confirmar una venta ya confirmada es idempotente: no duplica salidas ni auditoría.
- Las ventas confirmadas son de solo lectura.
- La auditoría registra la creación y la confirmación de ventas.
- Una venta puede vincularse de forma única a una orden entregada; esa venta confirmada entra a Caja como obligación pendiente hasta que se registren pagos.

Sprint propietario: 07.
