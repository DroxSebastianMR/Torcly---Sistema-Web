# Sales (web)

Módulo de ventas: listado con búsqueda y filtro por estado, detalle modal, registro/edición y confirmación de ventas de productos y servicios.

- La venta puede guardarse como **borrador** o confirmarse directamente; el cliente es opcional.
- Solo se ofrecen productos activos con stock y servicios activos; el stock insuficiente se rechaza en el formulario y el servidor es la fuente de verdad.
- Confirmar registra las salidas de inventario por producto; una venta confirmada es de solo lectura.
- La confirmación directa se envía como una sola acción y precarga la primera página de Caja para que la obligación quede disponible al cambiar de módulo.
- La anulación se solicita con motivo desde el detalle. Una venta ya cobrada exige compensar primero los pagos; una venta confirmada sin cobro repone el stock de forma trazable.
- La edición y la confirmación están limitadas por `sales:write`; la consulta por `sales:read`.

## Experiencia (Sprint 15)

- El modal de venta **no se cierra** ante un rechazo del servidor: conserva los
  valores ingresados y muestra el error para corregirlo.
- El listado expone una acción accesible por fila (`Ver venta <código>`) alcanzable
  con teclado, además de la fila clicable y la tarjeta móvil equivalente.

Sprint propietario: 07.
