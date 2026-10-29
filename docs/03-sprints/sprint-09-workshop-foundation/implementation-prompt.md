# Prompt de implementación - Sprint 09

```text
Implementa el Sprint 09 - Fundación de operación de taller en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Base aprobada: commit cde7e39 (Sprint 08 Citas).
- Rama de trabajo: feature/sprint-09-workshop-foundation.
- Lee primero y cumple por completo:
  - docs/03-sprints/sprint-09-workshop-foundation/README.md
  - docs/03-sprints/sprint-09-workshop-foundation/acceptance-and-test-plan.md
  - docs/04-calidad/definition-of-done.md
  - los módulos existentes de citas, productos, servicios, usuarios, permisos, auditoría y los patrones API/web ya usados.

Objetivo:
Construye el módulo de órdenes de taller que parte de una cita atendida y cubre diagnóstico, presupuesto, decisión del cliente y asignación técnica. Implementa HU-36 y HU-42 a HU-46 (RF-OPE-001 a RF-OPE-017) y deja fuera la ejecución del trabajo, el inventario operativo, cobros y entrega.

Reglas obligatorias:
1. Una cita PROGRAMADA se atiende una única vez y genera una sola OT-######. Debe conservar cliente y vehículo de la cita sin poder cambiarlos; la cita pasa a ATENDIDA. Citas CANCELADA o ATENDIDA no originan una orden nueva.
2. Estados mínimos de orden: RECEPCIONADA, EN_DIAGNOSTICO, PENDIENTE_APROBACION, APROBADA y RECHAZADA. Aplica transiciones válidas solo en servidor.
3. Diagnóstico y técnico deben ser consultables y editables según el estado permitido. El técnico se selecciona entre usuarios activos; no crees roles nuevos.
4. El presupuesto usa productos y servicios activos. Cada línea congela código, descripción, tipo, precio unitario, cantidad y subtotal. Cantidades deben ser positivas; no se puede enviar vacío.
5. Enviar presupuesto cambia a PENDIENTE_APROBACION. Aprobar o rechazar exige presupuesto enviado y registra responsable, fecha y observación opcional. Las decisiones deben conservarse; no se borran ni reescriben.
6. Este sprint NO crea movimientos de inventario, NO descuenta stock, NO confirma una venta, NO registra pago, NO factura, NO cierra ni entrega la orden. Eso es Sprint 10/11.
7. Usa permisos workshop:read y workshop:write en API y web. Toda mutación relevante debe dejar auditoría con actor, fecha e IP si existe.
8. Mantén los patrones del repositorio: schemas estrictos, controladores/rutas/servicio/repositorio, transacciones para cambios compuestos, manejo de errores en español y tests unitarios más integración protegida por DATABASE_TESTS.
9. En web crea /ordenes-taller, acceso de navegación, listado responsive con búsqueda/filtros/paginación/estados, ficha de detalle y formularios de diagnóstico, presupuesto, decisión y técnico. Desde Citas agrega la acción Atender y crear orden, gated por permiso.
10. Reutiliza componentes de UI existentes. Selectores y calendarios no deben recortarse, abrir scroll artificial ni bloquear el scroll de la página después de cerrar un modal. No modifiques flujos aprobados de ventas, inventario o citas salvo la transición necesaria a ATENDIDA.

Datos y migraciones:
- Agrega migraciones Prisma nuevas y seguras; no edites migraciones ya aplicadas.
- Actualiza schema, seed, rutas, endpoints, permisos y navegación cuando corresponda.
- No apliques migraciones ni seeds en la BD de desarrollo sin una petición expresa.
- No hagas commit ni push sin autorización expresa.
- No incluyas, borres ni modifiques .playwright-mcp/ (artefacto local fuera de git).

Calidad y documentación:
- Añade pruebas para reglas de estado, duplicado de cita, integridad cita/orden, presupuesto, decisión, permisos y UI crítica.
- Ejecuta y reporta API typecheck/lint/tests/prisma validate, web typecheck/lint/tests/build, format:check y git diff --check.
- Actualiza README de los módulos y los tres documentos del Sprint 09 con implementación y resultados reales. Conserva el acta como “Listo para prueba del usuario”; no declares aprobación ni cambies el porcentaje hasta la prueba manual y autorización del usuario.

Al finalizar, entrega un resumen conciso con archivos principales, verificaciones, migraciones pendientes y la guía de prueba manual. No realices commit ni push.
```

## Estado de implementación

Completado con los siguientes resultados reales:

- **API**: módulo `work-orders` (schemas, controller, routes, service, repository, rules), extensión de la cita a `ATENDIDA` con `attendedBy`/`attendedAt` y referencia a la orden en la respuesta, y `technicianId` en el resumen de la orden. Código legible `OT-######` vía `work_orders_code_seq`.
- **Web**: ruta `/ordenes-taller`, grupo de navegación **Operación de taller**, permisos `workshop` en `permissions.ts`, endpoints y paths; feature `work-orders` con tipos, servicio, hooks, formatters, esquemas, toolbar, tabla, página y modales de detalle, diagnóstico, presupuesto, decisión y técnico; acción **Atender y crear orden** en Citas con invalidación de consultas de órdenes.
- **Verificación**: API 171 unitarios + 75 integración gated, web 274 tests, typecheck, lint, build, `format:check` y `git diff --check` en verde.
- **Pendiente**: aplicar migraciones `20261015000000_add_work_order_foundation` y `20261016000000_add_work_order_audit_events` con la semilla en la BD de desarrollo (solo con petición expresa), ejecutar el plan de aceptación manual y obtener la aprobación del usuario. Acta en **Listo para prueba del usuario**.
