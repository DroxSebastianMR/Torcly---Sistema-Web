# Prompt de implementación - Sprint 11

```text
Implementa el Sprint 11 - Cobros, saldos e historial de pagos en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Base aprobada: Sprint 10 cerrado en el commit 34df27e.
- Rama de trabajo: feature/sprint-11-payments.
- Antes de cambiar código, lee completamente:
  - docs/03-sprints/sprint-11-payments/README.md
  - docs/03-sprints/sprint-11-payments/acceptance-and-test-plan.md
  - docs/03-sprints/sprint-11-payments/approval.md
  - docs/04-calidad/definition-of-done.md
  - módulos sales, inventory, auth, users, audit y los patrones API/web existentes.

Objetivo:
Implementa HU-37 a HU-41 (RF-PAG-001 a RF-PAG-018): registrar pagos de ventas confirmadas, calcular saldo pendiente, impedir sobrepagos, consultar obligaciones/pagos y conservar un historial financiero inmutable. Al aprobar, el acumulado será 62/92 = 67,39%.

Decisiones de alcance obligatorias:
1. Una obligación se origina solo en una Sale CONFIRMED con total positivo. DRAFT no se cobra. No cobres directamente WorkOrder ni crees ventas desde una orden entregada.
2. El saldo es derivado por el servidor: total congelado de la venta menos pagos confirmados más compensaciones confirmadas. Nunca almacenes un saldo editable ni modifiques total, líneas, precios o estado comercial de la venta.
3. Permite pagos parciales positivos. El pago no puede exceder el saldo. Usa Decimal de dos posiciones, validación estricta y un requestId UUID obligatorio para idempotencia.
4. Métodos iniciales: CASH, CARD, TRANSFER y DIGITAL_WALLET. Conserva su valor estable en persistencia y etiqueta en español en la UI.
5. El registro de pago y cualquier compensación/reversión se ejecutan en una transacción que bloquea la venta. Dos solicitudes concurrentes nunca pueden sobrepasar el saldo.
6. Un pago confirmado no se actualiza ni elimina. La corrección ocurre exclusivamente mediante una compensación/reversión explícita, vinculada al pago original, con motivo obligatorio y auditoría. No reutilices una edición o borrado.
7. Los estados de cobro PENDING, PARTIALLY_PAID y PAID son derivados para consulta; no reemplazan SaleStatus CONFIRMED.
8. Un pago o compensación no genera, cancela ni modifica InventoryMovement. Las salidas de inventario de una venta siguen siendo responsabilidad del Sprint 07.
9. Protege la API con cash:read/cash:write y verifica sales:read/sales:write cuando corresponda. Los guards web no sustituyen la autorización de servidor.
10. No implementes apertura/cierre de caja, arqueos, retiros, conciliación, comprobantes fiscales, facturación electrónica, créditos/cuotas, proveedores o pagos de órdenes de taller.

API y datos:
- Crea módulo payments con rutas, controller, service, repository, schemas, tipos, README y pruebas. Regístralo bajo /api/v1/payments.
- Agrega migraciones Prisma nuevas para Payment y los eventos/relaciones necesarios; no modifiques migraciones existentes ni apliques migraciones o seeds sin autorización expresa.
- Expón contratos paginados para: lista de obligaciones/ventas con saldo, detalle de obligación con historial, registrar pago y registrar compensación/reversión.
- Devuelve total, pagado, saldo y estado de cobro calculados desde servidor; serializa montos en forma consistente con sales.
- Agrega eventos AuditEventType para pago registrado y compensación/reversión. Incluye actor, venta, monto, método, requestId y referencia del evento original cuando aplique.
- Diseña índices para consulta por venta, fecha, método y estado, y aplica locks en la venta durante mutaciones financieras.

Web:
- Reemplaza el placeholder /caja por una feature payments con acceso gated por cash:read. Las acciones de registrar o compensar requieren cash:write.
- Implementa resumen de pendientes/cobrado, tabla de obligaciones, búsqueda por venta/cliente/documento, filtros de estado, método y período, paginación, detalle e historial.
- El modal de pago debe mostrar total, pagado y saldo actual, capturar método, importe y observación, y confirmar antes de persistir. Muestra mensajes de dominio claros en español.
- Usa formatos monetarios, estados loading/empty/error, componentes compartidos y UI responsive/accesible. No expongas UUIDs internos como referencia visible.

Calidad y documentación:
- Añade pruebas de elegibilidad por estado, pagos parciales, saldo cero, sobrepago, decimal inválido, concurrencia, idempotencia, compensación, inmutabilidad, filtros, permisos y ausencia de efectos en inventario.
- Ejecuta API typecheck/lint/tests/prisma validate; web typecheck/lint/tests/build; format:check y git diff --check. Reporta resultados reales.
- Actualiza README del módulo, documentos del Sprint 11 y trazabilidad si corresponde. Deja approval.md como “Listo para prueba del usuario”; no declares aprobación ni cambies el avance sin prueba manual y autorización expresa.
- No incluyas, borres ni modifiques .playwright-cli/, .playwright-mcp/, output/ ni tmp/; son artefactos locales fuera de control de versiones.

Al terminar, entrega un resumen conciso con archivos principales, verificaciones, migraciones pendientes y guía detallada de prueba manual. No hagas commit ni push.
```
