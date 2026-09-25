# Sales (web)

Módulo de ventas: listado con búsqueda y filtro por estado, detalle modal, registro/edición y confirmación de ventas de productos y servicios.

- La venta queda en **borrador** hasta confirmarla; el cliente es opcional.
- Solo se ofrecen productos activos con stock y servicios activos; el stock insuficiente se rechaza en el formulario y el servidor es la fuente de verdad.
- Confirmar registra las salidas de inventario por producto; una venta confirmada es de solo lectura.
- La edición y la confirmación están limitadas por `sales:write`; la consulta por `sales:read`.

Sprint propietario: 07.
