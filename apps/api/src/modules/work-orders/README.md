# Work orders (API)

Módulo de órdenes de taller que parte de una cita atendida y cubre diagnóstico, presupuesto, decisión del cliente, asignación de técnico, ejecución, consumo de repuestos, finalización, entrega e historial por vehículo.

- Una cita `PROGRAMADA` se atiende una única vez y genera una sola orden; la operación copia cliente y vehículo desde la cita y no permite cambiarlos. La cita queda `ATENDIDA`; una cita cancelada o ya atendida no origina otra orden.
- Estados: `RECEPCIONADA`, `EN_DIAGNOSTICO`, `PENDIENTE_APROBACION`, `APROBADA`, `RECHAZADA`, `EN_EJECUCION`, `LISTA_PARA_ENTREGA` y `ENTREGADA`. Las transiciones solo se aplican en servidor.
- El diagnóstico se registra o actualiza mientras la orden está en `RECEPCIONADA`, `EN_DIAGNOSTICO` o `PENDIENTE_APROBACION`.
- El presupuesto usa productos y servicios activos del catálogo; cada línea congela código, descripción, tipo, precio unitario, cantidad y subtotal. Las cantidades deben ser positivas y no se puede enviar un presupuesto vacío. Guardar/editar está permitido hasta registrar una decisión.
- Enviar el presupuesto pasa a `PENDIENTE_APROBACION`. Aprobar o rechazar exige un presupuesto enviado, registra responsable, fecha y observación opcional, y se conserva sin borrarse ni reescribirse.
- El técnico se elige entre usuarios activos y es opcional: la orden puede ejecutarse sin técnico asignado.
- Una orden `APROBADA` inicia ejecución (`EN_EJECUCION`), registrando responsable y fecha de inicio. Las actividades guardan responsable y fecha; al registrarse quedan completadas y no se borran físicamente.
- Los consumos corresponden a líneas de producto aprobadas; cada uno crea una salida `EXIT` idempotente por `requestId` en la misma transacción (lock orden → inventario, sin stock negativo), y la cantidad acumulada no supera la presupuestada. Una devolución crea un `ADJUSTMENT_IN` compensatorio sin editar la salida original.
- La finalización pasa la orden a `LISTA_PARA_ENTREGA`; antes de confirmar, el servidor exige declarar explícitamente si quedaron repuestos presupuestados sin consumir. Los pendientes confirmados como no utilizados no descuentan stock ni se facturan. Desde ese estado no hay nuevos consumos ni devoluciones.
- La entrega va a `ENTREGADA` con responsable, fecha y observación opcional; es inmutable para ejecución. En la misma transacción genera una única venta `CONFIRMED` enlazada a la orden, con todos los servicios y solo los productos efectivamente consumidos. La venta aparece en Ventas y crea su obligación pendiente en Caja. La entrega no registra ni marca un pago automáticamente.
- El historial del vehículo muestra exclusivamente órdenes `ENTREGADA` con diagnóstico, técnico, actividades y repuestos consumidos.
- Solo lectura con `workshop:read`; toda mutación requiere `workshop:write`. Cada cambio relevante deja auditoría con actor, fecha, entidad e IP cuando está disponible.
- El código legible se genera con la secuencia `work_orders_code_seq` como `OT-000001`.

Sprint propietario: 09 (base) y 10 (ejecución y entrega).
