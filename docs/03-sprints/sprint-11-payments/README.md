# Sprint 11 - Cobros, saldos e historial de pagos

Rama objetivo: `feature/sprint-11-payments`
Base: Sprint 10 cerrado (`34df27e`)
Historias: HU-37 a HU-41
Trazabilidad: RF-PAG-001 a RF-PAG-018
Avance esperado al aprobar: 62/92 = 67,39%

## Estado

**Implementado, migrado y pendiente de prueba y aprobación del usuario.** El código, las migraciones aplicadas en desarrollo, la semilla y las pruebas están listos. El avance acumulado sigue en **57/92 historias (61,96%)** y solo pasará a 62/92 tras la aprobación expresa.

## Implementación realizada

- API: módulo `payments` nuevo (`types`, `schemas`, `rules`, `repository`, `service`, `controller`, `routes`) montado en `/api/v1/payments`. Obligación derivada de ventas `CONFIRMED` con total positivo; saldo calculado en servidor (`total - pagos confirmados + compensaciones`); pagos parciales; estados derivados `PENDING`/`PARTIALLY_PAID`/`PAID` sin alterar `CONFIRMED`.
- Inmutabilidad y corrección: un pago confirmado no se edita ni borra; la corrección se realiza con una compensación ligada al pago original, con motivo obligatorio y auditoría.
- Idempotencia y concurrencia: claves `requestId` con replay del resultado ya registrado y operación transaccional con advisory lock de la venta para impedir sobrepagos concurrentes. Los pagos **no** generan movimientos de inventario.
- Migraciones: `20261018000000_add_payments` y `20261018010000_add_payment_audit_events` (**aplicadas en la BD de desarrollo el 07 oct. 2026**). Eventos de auditoría `PAYMENT_REGISTERED` y `PAYMENT_COMPENSATED`; permiso `cash:write` añadido a la semilla.
- Endpoints protegidos: consulta con `cash:read` + `sales:read`; mutación con `cash:write` + `sales:write`.
- Web: la ruta `/caja` reemplaza el placeholder por la feature `cash` con chips de resumen (ventas pendientes, saldo pendiente, cobrado en el período), barra de filtros (búsqueda, estado de cobro, método, rango de fechas), tabla de obligaciones, detalle con historial cronológico y modales de cobro y compensación, con acciones gated por permisos.
- Verificación automatizada en verde: API **215 pruebas + 95 de integración omitidas sin `DATABASE_TESTS`** (38 archivos), web **290 pruebas** (60 archivos), `typecheck`, `lint`, `build`, `format:check` y `git diff --check`.

## Objetivo

Registrar cobros de ventas confirmadas de forma segura, consultar el saldo pendiente y conservar un historial financiero inmutable por venta. El pago no altera precios, líneas, inventario ni la confirmación de la venta.

## Historias incluidas

| Historia | Resultado esperado                                                             |
| -------- | ------------------------------------------------------------------------------ |
| HU-37    | Registrar un pago positivo para una venta confirmada.                          |
| HU-38    | Admitir pagos parciales y calcular el saldo pendiente de la venta.             |
| HU-39    | Validar importe, estado de venta y límite de saldo antes de confirmar un pago. |
| HU-40    | Consultar ventas pendientes de cobro mediante búsqueda y filtros.              |
| HU-41    | Consultar el historial de pagos y el resumen de saldo de una venta.            |

## Alcance funcional

### Obligación y saldo

- Una obligación de cobro nace de una **venta `CONFIRMED`**. Las ventas en borrador no se pueden cobrar.
- El total de la venta es inmutable y el saldo se calcula en servidor: `total de venta - pagos confirmados + compensaciones confirmadas`, sin persistir un saldo editable que pueda desincronizarse.
- Se permiten pagos parciales positivos. Un pago no puede exceder el saldo actual ni dejar saldo negativo.
- La venta se presenta como `PENDIENTE`, `PARCIALMENTE_PAGADA` o `PAGADA` según su saldo derivado; no se modifica su estado comercial `CONFIRMED`.

### Registro de pago

- Cada pago conserva: código, venta, cliente disponible, importe, método, fecha/hora, observación opcional, usuario registrador y clave de idempotencia.
- Métodos iniciales propuestos: `CASH`, `CARD`, `TRANSFER` y `DIGITAL_WALLET`. Las etiquetas se muestran en español.
- El importe usa decimal monetario de dos posiciones, debe ser mayor que cero y no puede superar el saldo bajo una transacción con bloqueo de la venta.
- Reintentar la misma solicitud con el mismo `requestId` devuelve el resultado ya registrado; no crea otro pago.
- Un pago confirmado no se edita ni se borra. Si se requiere corregirlo, la única operación permitida será una compensación/reversión explícita, trazable y autorizada; no una edición silenciosa.

### Consulta

- La pantalla **Caja** se convierte en el módulo de cobros y muestra indicadores: ventas pendientes, saldo pendiente y cobrado en el período filtrado.
- Debe ofrecer búsqueda por código de venta, cliente o documento; filtros por estado de cobro, método y rango de fechas; paginación y estados de carga, vacío y error.
- El detalle de venta muestra total, total pagado, saldo, estado de cobro e historial cronológico de pagos/compensaciones.

## Reglas no negociables

1. Solo `sales:read`/`sales:write` y `cash:read`/`cash:write` autorizan cada consulta o mutación según corresponda; la API siempre valida permisos, además de los guards web.
2. El servidor es la fuente de verdad para saldo, importe máximo, estado de cobro e idempotencia.
3. Registrar o revertir un pago se realiza dentro de una transacción que bloquea la venta para evitar sobrepagos concurrentes.
4. Cada operación financiera escribe auditoría con actor, fecha, identificador de solicitud, venta y diferencia aplicada.
5. Ni los pagos ni sus compensaciones crean, revierten o duplican movimientos de inventario.
6. No se cobra directamente una orden de taller en este sprint: primero debe existir una venta confirmada. La integración orden-entrega-venta se evaluará como historia posterior si el backlog la incorpora.

## Alcance técnico esperado

### API y persistencia

- Crear módulo `payments` con rutas, controller, service, repository, schemas, tipos, pruebas y README siguiendo el estándar del repositorio.
- Incorporar migraciones Prisma nuevas para pagos, método, estado de evento y relación con `Sale`; no modificar migraciones ya aplicadas.
- Agregar eventos de auditoría para pago confirmado y compensación/reversión, junto con permisos de caja si faltan en la semilla/matriz.
- Exponer endpoints para listado de obligaciones, detalle, registro de pago, compensación/reversión y consulta de historial. Los listados deben paginarse y filtrar en servidor.
- Mantener importes como `Decimal` y serializarlos de manera numérica consistente en los contratos API.

### Web

- Reemplazar el placeholder de `/caja` por la feature `payments` o una composición equivalente con lectura y escritura gated por permisos.
- Implementar tabla de obligaciones, barra de filtros, detalle de pago y formulario/modal para registrar cobro con confirmación de importe y método.
- Informar de forma visible el total, pagado y saldo, y deshabilitar acciones no válidas sin depender de eso para la protección del servidor.
- Reutilizar controles compartidos, navegación, formatos de moneda, estados de feedback y patrones de accesibilidad ya existentes.

## Fuera de alcance

- Apertura/cierre de caja, arqueos, retiros, ingresos manuales de caja y conciliación bancaria.
- Comprobantes fiscales, facturación electrónica, notas de crédito/débito e integración tributaria.
- Créditos, cuotas, intereses, cuentas por cobrar de proveedores o cobranzas automatizadas.
- Modificar o cancelar ventas confirmadas, precios congelados o movimientos de inventario de Sprint 07.
- Cobro directo de órdenes de taller o creación automática de ventas desde una orden entregada.

## Dependencias y salida

- Depende de ventas confirmadas de Sprint 07 y de los permisos existentes de caja/ventas.
- Requiere datos de ventas confirmadas con total positivo para la prueba manual.
- Al aprobar, el proyecto pasa de 57/92 a **62/92 historias (67,39%)**. El Sprint 12 utilizará los pagos confirmados solo como datos de consulta.
