# Flujos funcionales y decisiones pendientes

Este documento completa los recorridos que el SRS describe por requisito, pero no conecta de extremo a extremo. Las transiciones marcadas como propuestas requieren validación de Mecatronic antes de sus pruebas de aceptación.

## 1. Acceso y sesión

1. El usuario envía `identifier` y contraseña.
2. La API valida formato, cuenta, bloqueo y hash.
3. Un fallo incrementa el contador; el quinto bloquea durante 15 minutos.
4. Un acierto reinicia fallos, crea sesión y entrega cookie HttpOnly.
5. Cada solicitud protegida valida sesión, inactividad y permiso.
6. Tras 30 minutos sin actividad o logout, la sesión queda inválida.

La respuesta de credenciales inválidas no revela si la cuenta existe.

## 2. Administración de usuarios

`crear con rol → consultar/buscar → actualizar datos o rol → desactivar/reactivar`

Desactivar revoca sesiones activas y evita nuevos accesos, pero conserva todas las referencias históricas. No existe borrado físico en V1.0.

## 3. Cliente y vehículo

`crear cliente → localizar cliente → registrar vehículo vinculado → consultar ficha conjunta`

Una cita u operación solo puede elegir vehículos del cliente seleccionado. Cambiar el propietario de un vehículo no se habilita hasta definir una política de transferencia con trazabilidad.

## 4. Producto e inventario

`crear producto → registrar stock inicial una vez → registrar entradas/salidas → recalcular stock → evaluar mínimo → consultar historial`

El catálogo nunca escribe el stock. El saldo se deriva de movimientos confirmados. Cada comando usa una clave de idempotencia; una operación repetida devuelve el resultado previo sin duplicar el movimiento. Las salidas se confirman dentro de una transacción que bloquea el stock negativo.

## 5. Catálogo de servicios

`crear servicio → buscar/consultar → actualizar referencia → desactivar`

Solo servicios activos aparecen en nuevas citas, operaciones y ventas. Los registros históricos conservan descripción e importe confirmados aunque cambie el catálogo.

## 6. Cita a entrega del vehículo

Flujo propuesto para validar:

`PROGRAMADA → CONFIRMADA → ATENDIDA → operación creada`

Alternativas terminales: `CANCELADA` o `NO_ASISTIO`. Reprogramar conserva el historial y vuelve a validar capacidad.

Estados propuestos de operación:

`RECIBIDA → EN_DIAGNOSTICO → PENDIENTE_APROBACION → APROBADA → EN_TRABAJO → FINALIZADA → ENTREGADA`

Transiciones alternativas: `PRESUPUESTO_RECHAZADO` desde `PENDIENTE_APROBACION` y `CANCELADA` según autorización. Cada cambio conserva fecha, usuario y observación. No se inicia trabajo sin aprobación ni se finaliza con datos obligatorios pendientes.

## 7. Consumo, venta y pago

- Confirmar un repuesto usado crea una sola salida de inventario.
- La venta vinculada reutiliza ese consumo y no descuenta nuevamente.
- Confirmar una venta congela precios e importes y genera las salidas de productos vendidos que aún no tengan consumo previo.
- Un pago positivo se aplica a una única obligación y nunca supera el saldo.
- Los pagos confirmados no se eliminan; cualquier corrección requiere una operación compensatoria auditada.

## 8. BI e IA

BI lee solo operaciones válidas/confirmadas y permite rastrear cada KPI a sus registros de origen. IA lee salidas confirmadas sin duplicar consumos, verifica elegibilidad y conserva cada ejecución. Una recomendación nunca crea compras ni movimientos.

## Decisiones que aún requieren validación

- formatos exactos de DNI, RUC, teléfono y placa aceptados;
- roles iniciales y matriz permiso/acción, no solo permiso de lectura;
- capacidad del taller, duración de citas y regla de superposición;
- catálogo definitivo de estados y transiciones de cita/operación;
- política para transferir un vehículo entre clientes;
- motivos y procedimiento de corrección/anulación de ventas y pagos;
- criterio mínimo y método versionado para IA;
- KPI aprobados, fórmula, unidad, periodo y anulaciones;
- proveedor/configuración de correo, respaldo, despliegue y retención.
