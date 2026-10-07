# Cash (web)

Módulo de cobros sobre la ruta `/caja`: listado de ventas confirmadas pendientes de pago, barra de filtros, detalle con historial y modales para registrar pagos y compensaciones.

- Cada fila es una obligación derivada de una **venta confirmada** con total positivo; el estado de cobro (`PENDING`, `PARTIALLY_PAID`, `PAID`) y el saldo los calcula el servidor y la interfaz solo los muestra.
- Los chips de resumen informan ventas pendientes, saldo pendiente y cobrado en el período/método filtrado.
- Filtros: búsqueda por código, cliente o documento; estado de cobro; método; y rango de fechas.
- Un pago confirmado no se edita ni elimina: la corrección se hace con una compensación con motivo obligatorio ligada al pago original, visible en el historial.
- Cada operación envía un `requestId` único (`crypto.randomUUID()`) para evitar duplicados al reintentar.
- La consulta está limitada por `cash:read` + `sales:read`; el cobro y la compensación por `cash:write` + `sales:write`.

Sprint propietario: 11.
