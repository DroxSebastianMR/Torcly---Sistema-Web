# Cash (web)

Módulo de Caja sobre la ruta `/caja`: apertura y cierre manual de períodos, listado de ventas confirmadas, pagos, compensaciones e historial de arqueos.

- Cada fila es una obligación derivada de una **venta confirmada** con total positivo; el estado de cobro (`PENDING`, `PARTIALLY_PAID`, `PAID`) y el saldo los calcula el servidor y la interfaz solo los muestra.
- Los chips de resumen informan ventas pendientes, saldo pendiente y cobrado en el período/método filtrado.
- Filtros: búsqueda por código, cliente o documento; estado de cobro; método; y rango de fechas.
- Un pago confirmado no se edita ni elimina: la corrección se hace con una compensación con motivo obligatorio ligada al pago original, visible en el historial.
- Cada operación envía un `requestId` único (`crypto.randomUUID()`) para evitar duplicados al reintentar.
- La consulta está limitada por `cash:read` + `sales:read`; el cobro y la compensación por `cash:write` + `sales:write`.
- Una caja abierta es obligatoria para nuevos cobros y compensaciones. Muestra efectivo esperado y totales separados por método; el cierre manual guarda efectivo contado y diferencia.
- Los pagos previos al control de caja se preservan como registros históricos sin sesión asociada.

Sprints propietarios: 11 y 21.
