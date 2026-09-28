# Work orders (API)

Módulo de órdenes de taller que parte de una cita atendida y cubre diagnóstico, presupuesto, decisión del cliente y asignación de técnico.

- Una cita `PROGRAMADA` se atiende una única vez y genera una sola orden; la operación copia cliente y vehículo desde la cita y no permite cambiarlos. La cita queda `ATENDIDA`; una cita cancelada o ya atendida no origina otra orden.
- Estados: `RECEPCIONADA`, `EN_DIAGNOSTICO`, `PENDIENTE_APROBACION`, `APROBADA` y `RECHAZADA`. Las transiciones solo se aplican en servidor.
- El diagnóstico se registra o actualiza mientras la orden está en `RECEPCIONADA`, `EN_DIAGNOSTICO` o `PENDIENTE_APROBACION`.
- El presupuesto usa productos y servicios activos del catálogo; cada línea congela código, descripción, tipo, precio unitario, cantidad y subtotal. Las cantidades deben ser positivas y no se puede enviar un presupuesto vacío. Guardar/editar está permitido hasta registrar una decisión.
- Enviar el presupuesto pasa a `PENDIENTE_APROBACION`. Aprobar o rechazar exige un presupuesto enviado, registra responsable, fecha y observación opcional, y se conserva sin borrarse ni reescribirse.
- El técnico se elige entre usuarios activos y se puede cambiar mientras la orden no esté aprobada.
- Este sprint **no** descuenta stock, no crea movimientos de inventario, no confirma ventas ni registra pagos, comprobantes o entregas.
- Solo lectura con `workshop:read`; toda mutación requiere `workshop:write`. Cada cambio relevante deja auditoría con actor, fecha, entidad e IP cuando está disponible.
- El código legible se genera con la secuencia `work_orders_code_seq` como `OT-000001`.

Sprint propietario: 09.
