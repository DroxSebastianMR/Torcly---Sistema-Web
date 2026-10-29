# Prompt de implementación - Sprint 10

```text
Implementa el Sprint 10 - Ejecución, consumo y entrega de taller en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Base aprobada: commit 515c27b (Sprint 09 cerrado, incluido el ajuste final de inventario).
- Rama de trabajo: feature/sprint-10-workshop-execution.
- Lee completamente antes de cambiar código:
  - docs/03-sprints/sprint-10-workshop-execution/README.md
  - docs/03-sprints/sprint-10-workshop-execution/acceptance-and-test-plan.md
  - docs/04-calidad/definition-of-done.md
  - módulos actuales work-orders, inventory, vehicles, products, appointments, auditoría, permisos y patrones API/web.

Objetivo:
Implementa HU-47 a HU-57 (RF-OPE-018 a RF-OPE-026): iniciar ejecución de una orden aprobada, actividades técnicas, consumo y devolución de repuestos, finalización, entrega e historial del vehículo. Esta fase comienza después del presupuesto aprobado del Sprint 09.

Reglas obligatorias:
1. Solo una orden APROBADA con técnico asignado puede iniciar; pasa a EN_EJECUCION y registra actor/fecha. Rechaza todas las demás combinaciones de estado.
2. Crea actividades de ejecución con descripción, responsable, fecha y estados PENDIENTE/COMPLETADA. No borres físicamente actividades ni su auditoría.
3. Solo permite consumir productos que sean líneas de producto del presupuesto aprobado. La cantidad acumulada consumida no supera la presupuestada.
4. Cada consumo debe crear, en la misma transacción, un movimiento InventoryMovement EXIT confirmado y ligado internamente a la orden. Valida stock bajo lock, impide stock negativo y usa idempotencia para que un reintento o solicitudes concurrentes no descuenten dos veces.
5. Una devolución no edita ni elimina la salida: crea ADJUSTMENT_IN compensatorio ligado a la orden y reduce el consumo neto permitido. Solo se permite antes de finalizar.
6. Con actividades completas y sin operaciones pendientes, la orden pasa de EN_EJECUCION a LISTA_PARA_ENTREGA. Desde allí no se permiten nuevas actividades, consumos ni devoluciones.
7. Solo LISTA_PARA_ENTREGA puede pasar a ENTREGADA; persiste responsable, fecha y observación opcional. ENTREGADA es inmutable para operaciones de ejecución.
8. El historial del vehículo muestra únicamente órdenes ENTREGADA con diagnóstico, técnico, actividades y repuestos consumidos netos.
9. No implementes pagos, caja, saldo, comprobantes, facturación, venta ni descuento ajeno al consumo de una orden: todo cobro pertenece al Sprint 11.
10. Conserva los permisos workshop:read y workshop:write, registra auditoría para todas las mutaciones y entrega errores de dominio claros en español.

API y datos:
- Agrega migraciones Prisma nuevas; nunca modifiques migraciones ya aplicadas.
- Extiende de forma compatible WorkOrderStatus y crea los modelos necesarios para actividades y consumos. Mantén las líneas, decisión y presupuesto aprobados del Sprint 09 inmutables.
- Crea rutas, controller, service, repository, schemas y tipos siguiendo el estándar del repositorio. Cada cambio crítico debe ser transaccional y protegido por los locks necesarios.
- Expón listados, detalle y un endpoint de historial por vehículo con filtros/paginación si corresponde.
- No apliques migraciones ni seeds en la BD de desarrollo sin solicitud expresa. No hagas commit ni push sin autorización expresa.

Web:
- Extiende la ruta /ordenes-taller y su ficha con acciones gated por workshop:write, actividad, consumo, devolución, finalización, entrega y una cronología clara.
- Muestra cantidad presupuestada, consumida, devuelta y pendiente por cada repuesto. Advierte antes de cambios irreversibles.
- Agrega historial del vehículo y enlázalo con las órdenes entregadas.
- Mantén UI responsive, estados loading/empty/error, accesibilidad y componentes compartidos. Los selectores deben sobreponerse a diálogos, poder desplazarse, y no mostrar barras de scroll visibles.

Calidad y documentación:
- Añade pruebas de reglas de transición, técnico obligatorio, actividad, máximo presupuestado, stock insuficiente, concurrencia/idempotencia, devolución compensatoria, inmutabilidad tras entrega, permisos e historial.
- Ejecuta y reporta API typecheck/lint/tests/prisma validate; web typecheck/lint/tests/build; format:check y git diff --check.
- Actualiza README de módulos y los documentos del Sprint 10 con resultados reales. Deja approval.md en “Listo para prueba del usuario”; no declares aprobación ni cambies el porcentaje antes de prueba manual y autorización del usuario.
- No incluyas, borres ni modifiques .playwright-cli/, .playwright-mcp/, output/ ni tmp/; son artefactos locales fuera de control de versiones.

Al terminar, entrega resumen conciso con archivos principales, verificaciones, migraciones pendientes y guía detallada de prueba manual. No realices commit ni push.
```

## Estado de implementación

Completado con los siguientes resultados reales:

- **API**: `work-orders` ampliado con ejecución, actividades, consumo/devolución idempotentes y transaccionales, finalización, entrega e historial por vehículo. Modelos y migraciones `20261017000000_add_work_order_execution` y `20261017010000_add_work_order_execution_audit_events`; rutas protegidas por `workshop:read`/`workshop:write`. Errores de dominio en español: `WORK_ORDER_TECHNICIAN_REQUIRED`, `WORK_ORDER_STATUS_INVALID`, `WORK_ORDER_QUANTITY_EXCEEDS_BUDGET`, `INSUFFICIENT_STOCK`, `WORK_ORDER_RETURN_EXCEEDS_CONSUMED`, `WORK_ORDER_NO_ACTIVITIES`, `WORK_ORDER_ACTIVITIES_PENDING`.
- **Web**: `/ordenes-taller` con panel de ejecución en la ficha, chips de estado, modales de actividad/consumo/devolución/entrega, confirmaciones irreversibles y acciones según estado y permiso; historial del vehículo en su ficha (gated por `workshop:read`).
- **Verificación**: API 190 unitarios + 87 de integración gated (24 archivos), web 286 tests (59 archivos), typecheck, lint, build, `format:check` y `git diff --check` en verde.
- **Pendiente**: aplicar migraciones con la semilla en la BD de desarrollo (solo con petición expresa), ejecutar el plan de aceptación manual y obtener la aprobación del usuario. Acta en **Listo para prueba del usuario**; no se registró el 61,96%.
