# Prompt de implementación - Sprint 21

```text
Implementa exclusivamente Sprint 21 - Apertura y cierre semanal de caja de Torcly.

Lee por completo README.md, acceptance-and-test-plan.md y approval.md de docs/03-sprints/sprint-21-cash-sessions, además de definition-of-done, module-standard, payments, sales, audit, auth, notifications y la feature web cash antes de modificar código.

Extiende Cobros con sesiones manuales de caja. Debe existir una única sesión OPEN; se abre manualmente con efectivo inicial >= 0 y nota opcional, sin calendario automático. Para crear un pago o compensación debe existir caja abierta. Vincula los nuevos eventos a esa sesión; no inventes sesión para pagos históricos, que deben conservar cashSessionId null.

El servidor calcula efectivo esperado: monto inicial + pagos CASH - compensaciones CASH. Card, transfer y digital wallet son totales informativos y no alteran efectivo físico. El cierre es manual e inmutable: pide efectivo contado y exige nota si existe diferencia. Persiste esperado, contado, diferencia, responsable y fechas. No edites ni reabras cierres. Una compensación posterior de un pago de caja cerrada debe ir a una sesión abierta actual, preservando el cierre previo.

Agrega CashSession, CashSessionStatus, relación nullable Payment.cashSessionId, índices apropiados, índice único parcial PostgreSQL para solo una sesión OPEN, secuencia CAJA, eventos de auditoría de apertura/cierre y migración nueva. No ejecutes migraciones ni seed sin autorización.

Expón API protegida por cash:read/cash:write: caja actual, abrir, cerrar, historial paginado y detalle. Usa transacciones, advisory locks e idempotencia requestId para operaciones críticas. Nunca confíes en cálculos del cliente, no expongas notas internas ni datos sensibles en logs y no alteres ventas ni inventario.

En web, evoluciona /caja a Caja actual, Cobros e Historial de cierres. Implementa formularios accesibles de apertura/cierre, resumen por método, diferencia visible, estados loading/vacío/error/restringido, refresco de queries y acciones bloqueadas cuando no existe caja abierta. Mantén el historial de pagos actual.

Añade pruebas unitarias, integración gated con PostgreSQL y pruebas web según el plan de aceptación. Ejecuta typecheck, lint, tests, build, format:check y git diff --check. Actualiza los READMEs con resultados reales y deja approval.md como “Listo para prueba del usuario” únicamente al finalizar la implementación. No hagas commit ni push.
```
