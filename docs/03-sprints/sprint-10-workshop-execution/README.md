# Sprint 10 - Ejecución, consumo y entrega de taller

Rama objetivo: `feature/sprint-10-workshop-execution`
Base: Sprint 09 aprobado (`515c27b`)
Historias: HU-47 a HU-57
Avance esperado al aprobar: 57/92 = 61,96%

## Estado

**Aprobado y cerrado.** El acumulado del proyecto es **57/92 historias (61,96%)**.

## Implementación realizada

- API: extensiones en `work-orders` para ejecución, consumo, devolución, finalización y entrega. Estados `EN_EJECUCION`, `LISTA_PARA_ENTREGA` y `ENTREGADA`; esquemas, reglas, repositorio, servicio, controlador y rutas nuevos.
- Migraciones: `20261017000000_add_work_order_execution` y `20261017010000_add_work_order_execution_audit_events` (creadas, **no aplicadas**).
- Endpoints protegidos por `workshop:read` / `workshop:write`: iniciar ejecución, consultar ejecución, registrar/completar actividades, consumos, devoluciones, finalizar, entregar e historial por vehículo.
- Consumos y devoluciones transaccionales e idempotentes por `requestId`: cada consumo crea una salida `EXIT` y cada devolución una compensación `ADJUSTMENT_IN` ligadas a la orden, sin editar ni borrar el movimiento original; validación de stock bajo lock con orden de locks orden → inventario.
- Web: ruta `/ordenes-taller` ampliada con panel de ejecución en la ficha, modales de actividad, consumo, devolución y entrega, chips de estado, acciones gated por `workshop:write` y confirmaciones para transiciones irreversibles; sección de historial por vehículo en la ficha del vehículo (gated por `workshop:read`, paginada).
- Verificación automatizada en verde: API **190 unitarios + 87 de integración gated** (24 archivos), web **286 tests** (59 archivos), typecheck, lint, build, `format:check` y `git diff --check`.
- Validación manual registrada: el usuario confirmó el flujo de inicio de ejecución y autorizó el cierre del sprint el 7 de octubre de 2026. La demostración offline conserva un recorrido reproducible de actividades, consumo, devolución, finalización, entrega e historial técnico.

## Objetivo

Convertir una orden de trabajo aprobada en una atención ejecutada y entregada: iniciar el trabajo, registrar lo realizado, consumir repuestos de manera segura, finalizar la orden y conservar un historial de mantenimiento por vehículo. El sprint no cobra, no factura ni registra saldos.

## Historias incluidas

| Historia | Resultado esperado                                                                 |
| -------- | ---------------------------------------------------------------------------------- |
| HU-47    | Iniciar la ejecución de una orden aprobada y asignada a un técnico.                |
| HU-48    | Registrar las actividades técnicas realizadas durante la atención.                 |
| HU-49    | Consultar el avance y los responsables de la ejecución.                            |
| HU-50    | Consumir un producto presupuestado con salida de inventario trazable.              |
| HU-51    | Corregir una devolución de repuesto sin editar ni borrar el movimiento original.   |
| HU-52    | Validar stock y evitar consumos duplicados o superiores a la disponibilidad.       |
| HU-53    | Marcar la orden como lista para entrega cuando el trabajo esté terminado.          |
| HU-54    | Registrar la entrega del vehículo al cliente.                                      |
| HU-55    | Consultar las órdenes terminadas y entregadas.                                     |
| HU-56    | Mostrar el historial de mantenimiento por vehículo.                                |
| HU-57    | Mantener la trazabilidad completa entre orden, actividades, consumos e inventario. |

## Reglas funcionales

- Solo una orden `APROBADA` y con técnico asignado puede iniciar ejecución. Al iniciar pasa a `EN_EJECUCION` y registra quién y cuándo inició.
- Las actividades son registros de texto con responsable, fecha y estado `PENDIENTE` o `COMPLETADA`. Una actividad completada no se elimina; una corrección se conserva como actualización auditable.
- Los productos consumidos deben corresponder a líneas de producto aprobadas en el presupuesto. No se agregan piezas fuera del presupuesto sin volver al flujo de aprobación del Sprint 09.
- Cada consumo crea exactamente una salida de inventario `EXIT`, con referencia interna a la orden y una clave de idempotencia por orden y línea. El servidor valida el stock dentro de la misma transacción: no puede quedar stock negativo ni duplicarse una salida ante reintentos concurrentes.
- La cantidad acumulada consumida de una línea no puede superar la cantidad presupuestada. Los servicios se registran como actividades; no generan movimientos de inventario.
- Si una pieza no llegó a usarse, su devolución se registra como un movimiento compensatorio `ADJUSTMENT_IN` ligado a la misma orden. Nunca se edita ni elimina la salida original.
- Solo una orden `EN_EJECUCION` con todas sus actividades completadas y sin consumos pendientes puede pasar a `LISTA_PARA_ENTREGA`.
- La entrega solo es posible desde `LISTA_PARA_ENTREGA`; pasa a `ENTREGADA` y guarda fecha, usuario y observación opcional. Una orden entregada es inmutable para ejecución y consumo.
- La entrega no exige pago ni cambia caja, venta o saldo. El cobro pertenece al Sprint 11.
- El historial del vehículo muestra exclusivamente órdenes `ENTREGADA`, con fecha, código, diagnóstico, actividades, productos consumidos y técnico responsable.
- Toda transición, actividad, consumo, devolución, finalización y entrega debe generar auditoría con actor, fecha, identificador e IP cuando esté disponible.

## Alcance técnico esperado

### API

- Extender el módulo `work-orders` con los estados `EN_EJECUCION`, `LISTA_PARA_ENTREGA` y `ENTREGADA`, sin alterar las reglas ya aprobadas de diagnóstico y presupuesto.
- Crear modelos y migraciones para actividades de orden y consumos de orden, con relaciones a sus líneas presupuestadas y movimientos de inventario. Las salidas y devoluciones se deben conservar como eventos inmutables.
- Endpoints protegidos por `workshop:read` / `workshop:write` para iniciar, listar/registrar/completar actividades, registrar consumo, devolver consumo, finalizar, entregar y consultar historial por vehículo.
- Ejecutar en transacción el consumo o la devolución junto con su movimiento de inventario, validación de stock, idempotencia y auditoría.
- Ampliar los detalles y listados para incluir avance, actividades, consumos, fechas de inicio/finalización/entrega e historial de vehículo.
- Agregar eventos de auditoría para cada operación de ejecución y errores de dominio claros en español.

### Web

- Ampliar `/ordenes-taller` y su ficha con cronología de ejecución, técnico, actividades, repuestos consumidos, devolución y acciones según estado y permiso.
- Formularios de actividad y consumo con validación de campos, disponibilidad, cantidad restante presupuestada, confirmación para acciones irreversibles y mensajes de error comprensibles.
- Acciones visibles: **Iniciar ejecución**, **Registrar actividad**, **Completar actividad**, **Consumir repuesto**, **Devolver repuesto**, **Finalizar trabajo** y **Entregar vehículo**, solo cuando la transición sea válida y exista `workshop:write`.
- Mostrar el historial del vehículo desde la ficha de vehículo y/o la orden, con enlaces a órdenes entregadas y estados vacío, carga y error.
- Reutilizar controles existentes y mantener menús, selectores y diálogos superpuestos, accesibles y sin barras de desplazamiento visibles.

## Fuera de alcance

- Cobros, métodos de pago, saldos, comprobantes, caja y facturación: Sprint 11.
- Nuevos presupuestos, cambio de cliente/vehículo, cambio de precios o modificación de una orden aprobada: Sprint 09.
- Compras, proveedores, órdenes de compra y reposición automática.
- Programación de técnicos, horas facturables, nómina, agenda por bahías y notificaciones externas.
- Borrado físico de actividades, consumos, devoluciones, órdenes o movimientos de inventario.

## Dependencias

- Sprint 09 aprobado: orden, técnico, diagnóstico y presupuesto aprobado.
- Sprint 06 aprobado: productos, existencias y movimientos de inventario.
- Sprint 04 aprobado: vehículos y sus fichas.

## Cierre

Sprint 10 aprobado y cerrado el 7 de octubre de 2026. El acumulado es 57/92 historias (61,96%). La ejecución cuenta con migraciones, pruebas automatizadas, controles de permisos y trazabilidad de inventario; el cobro continúa fuera de alcance y corresponde al Sprint 11.
