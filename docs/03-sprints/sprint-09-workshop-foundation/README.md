# Sprint 09 - Fundación de operación de taller

Rama objetivo: `feature/sprint-09-workshop-foundation`
Base: Sprint 08 aprobado (`cde7e39`)
Historias: HU-36, HU-42 a HU-46
Avance esperado al aprobar: 46/92 = 50,00%

## Estado

**Aprobado por el usuario.** La prueba manual confirmó el flujo hasta una orden aprobada; el cobro sigue correctamente fuera del alcance de este sprint.

## Implementación realizada

- API: módulo `work-orders` con esquemas estrictos, controlador, rutas, servicio y repositorio; endpoints de listado/detalle/catálogo/técnicos y las mutaciones de atender cita, diagnóstico, presupuesto (guardar y enviar), decisión y técnico. Códigos `OT-######` con la secuencia `work_orders_code_seq`.
- Web: ruta `/ordenes-taller` con navegación, listado responsive (búsqueda, filtros por estado/técnico, paginación y estados de carga, vacío y error), ficha de detalle y modales de diagnóstico, presupuesto, decisión y técnico; acción **Atender y crear orden** desde Citas.
- Permisos `workshop:read` y `workshop:write` en API y web; auditoría por evento relevante.
- El presupuesto aprobado no genera movimientos de inventario, ventas ni pagos (alcance de Sprints 10 y 11).
- Verificación automatizada en verde: tests API (171 unitarios, 75 de integración gated), 274 tests web, typecheck, lint, build, `format:check` y `git diff --check`. Las migraciones se aplicaron y el flujo fue probado manualmente en la BD de desarrollo.

## Objetivo

Transformar una cita atendida en una orden de trabajo trazable. El administrador podrá registrar el diagnóstico, preparar un presupuesto con precios congelados, obtener la decisión del cliente y asignar al técnico responsable, sin iniciar todavía la ejecución ni alterar existencias.

## Historias incluidas

| Historia | Resultado esperado                                                                                |
| -------- | ------------------------------------------------------------------------------------------------- |
| HU-36    | Crear una orden de trabajo desde una cita programada atendida, conservando cliente y vehículo.    |
| HU-42    | Registrar y consultar el diagnóstico técnico de una orden.                                        |
| HU-43    | Preparar un presupuesto con productos y servicios del catálogo, con cantidades, importes y total. |
| HU-44    | Registrar la aprobación o el rechazo del presupuesto y conservar el responsable y la fecha.       |
| HU-45    | Asignar o cambiar el técnico responsable antes de ejecutar el trabajo.                            |
| HU-46    | Consultar, buscar y filtrar las órdenes y abrir su detalle operativo.                             |

## Decisiones funcionales

- Una cita `PROGRAMADA` puede atenderse una única vez y generar una sola orden. La operación copia su cliente y vehículo desde la cita; no permite cambiarlos.
- Atender la cita la conserva para consulta y la marca como `ATENDIDA`. Una cita cancelada o ya atendida no puede originar otra orden.
- La orden inicia en `RECEPCIONADA`. El diagnóstico la mueve a `EN_DIAGNOSTICO`; al enviar un presupuesto pasa a `PENDIENTE_APROBACION`; la decisión la lleva a `APROBADA` o `RECHAZADA`.
- El presupuesto se compone exclusivamente de productos y servicios activos del catálogo. Cada línea congela descripción, código, tipo, precio unitario, cantidad y subtotal al momento de guardarla. Puede modificarse mientras no se haya registrado una decisión.
- Aprobar o rechazar requiere una orden con presupuesto enviado. La decisión guarda fecha, usuario que la registra y observación opcional; no se elimina ni se reescribe.
- El técnico se elige entre usuarios activos. En la instalación actual, los administradores son los usuarios disponibles; el modelo debe quedar preparado para otros roles sin crear roles nuevos en este sprint.
- La aprobación solo habilita la ejecución posterior: **no descuenta stock, no crea movimientos de inventario, no genera venta, pago, comprobante ni entrega**. Esas acciones pertenecen a los Sprints 10 y 11.
- Todos los cambios relevantes dejan auditoría con actor, fecha, entidad e IP cuando esté disponible.

## Alcance técnico esperado

### API

- Modelos y migraciones para orden de trabajo, diagnóstico, presupuesto, líneas de presupuesto y asignación técnica; códigos legibles `OT-######` y relaciones con cita, cliente, vehículo y usuario.
- Extensión controlada de la cita para el estado `ATENDIDA`, sin modificar el comportamiento ya aprobado de capacidad y cancelación.
- Módulo `workshop` protegido por `workshop:read` y `workshop:write`, con listados paginados, búsqueda por código, cliente, placa o técnico, filtros por estado y detalle.
- Endpoints para atender una cita, registrar/actualizar diagnóstico, guardar/enviar presupuesto, aprobar/rechazar presupuesto y asignar técnico. Las transiciones se validan en servidor y los cambios compuestos se ejecutan en transacción.
- Reglas de integridad: cita existente y programada, una orden por cita, catálogo activo para nuevas líneas, cantidades positivas, precio monetario no negativo, presupuesto no vacío al enviarse y decisión una sola vez por presupuesto enviado.
- Eventos de auditoría específicos para creación de orden, diagnóstico, presupuesto, decisión y asignación.

### Web

- Ruta `/ordenes-taller` y acceso desde el menú de operación del taller, protegidos por `workshop:read`.
- Pantalla de órdenes con resumen, búsqueda, filtros de estado/técnico, tabla y tarjetas responsive, paginación y estados de carga, vacío y error.
- Desde Citas, acción visible para **Atender y crear orden** solo cuando la cita esté `PROGRAMADA` y exista `workshop:write`.
- Ficha de orden con cabecera de cliente, vehículo, cita de origen, estado, técnico y cronología; formularios de diagnóstico, presupuesto, decisión y asignación protegidos por `workshop:write`.
- Selector de líneas de presupuesto que muestre código, nombre y precio; el total y subtotales se recalculan en pantalla, pero la API conserva la validación definitiva.

## Fuera de alcance

- Ejecución del trabajo, tiempos, checklist, consumo o devolución de repuestos, movimientos de inventario, cambio a trabajo terminado, entrega e historial de mantenimiento: Sprint 10.
- Cobros, saldos, pagos, comprobantes, caja y facturación: Sprint 11.
- Modificar cliente, vehículo o cita de origen desde una orden, borrado físico de órdenes o de decisiones, creación de roles y agenda por bahías.

## Dependencias

- Sprint 08 aprobado: citas, clientes y vehículos.
- Sprint 06 aprobado: catálogo de productos, servicios e inventario solo para consulta de disponibilidad; en este sprint no se escribe inventario.
- Usuarios activos del Sprint 02 para la asignación técnica.

## Cierre

El Sprint 09 está aprobado y cerrado. El acumulado es 46/92 historias (50,00%). La ejecución, el consumo de inventario, el cierre y la entrega se implementarán en el Sprint 10; los cobros quedan para el Sprint 11.
