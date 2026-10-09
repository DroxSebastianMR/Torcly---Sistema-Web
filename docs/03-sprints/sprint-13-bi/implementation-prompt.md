# Prompt de implementación - Sprint 13

```text
Implementa Sprint 13 - Inteligencia de negocio en Torcly.

Antes de cambiar código, lee completamente README.md, acceptance-and-test-plan.md y approval.md de docs/03-sprints/sprint-13-bi, además de definition-of-done.md y los módulos sales, payments, inventory, services, appointments, work-orders y operations.

Objetivo: HU-66 a HU-73 / RF-BI-001 a RF-BI-009. Implementa Reportes de solo lectura con indicadores históricos trazables de ventas, cobros, inventario, servicios y taller, filtros de período y drill-down a módulos fuente.

Reglas obligatorias:
1. No mutar datos ni crear migraciones/seeds sin autorización expresa.
2. Toda métrica se calcula en servidor y declara fuente, período, estados incluidos y criterio.
3. Reutiliza reglas de saldo de payments y stock de inventory; no dupliques lógica en web.
4. Protege cada bloque con los permisos de lectura de su fuente; no devuelvas ni representes como cero datos no autorizados.
5. Gráficos accesibles, etiquetados y con tabla equivalente; no expongas UUIDs.
6. Fuera de alcance: exportación, pronósticos, IA, metas, facturación, conciliación o edición.

API: crea módulo BI de lectura con schemas, repository, service, controller, routes, tipos, README y pruebas. Web: reemplaza el placeholder de Reportes por una feature con filtros, indicadores, gráficos/tablas y estados loading/empty/error.

Calidad: ejecuta API typecheck/lint/tests; web typecheck/lint/tests/build; format:check y git diff --check. Actualiza los documentos con resultados reales y deja approval.md como Listo para prueba del usuario. No hagas commit/push y no toques .playwright-mcp/, .playwright-cli/, output/ ni tmp/.
```
