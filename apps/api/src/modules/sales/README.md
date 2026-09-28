# Sales (API)

Gestiona ventas de productos y servicios en dos estados: borrador y confirmada.

- Una venta inicia como **borrador** y suele quedar asociada a un cliente opcional.
- Solo se agregan **productos activos con stock** y **servicios activos**.
- Cada línea conserva una copia del nombre, código, unidad y precio al momento de guardarse (precios congelados).
- Confirmar valida el stock en servidor y genera **salidas de inventario exactas** por producto en la misma transacción.
- Confirmar una venta ya confirmada es idempotente: no duplica salidas ni auditoría.
- Las ventas confirmadas son de solo lectura.
- La auditoría registra la creación y la confirmación de ventas.

Sprint propietario: 07.
