# Prompt de implementación - Sprint 12

```text
Implementa el Sprint 12 - Consulta operativa en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Rama de trabajo: feature/sprint-12-operational-dashboard.
- Base requerida: Sprint 11 aprobado. Si approval.md del Sprint 11 no registra aprobación expresa, detente y repórtalo; no empieces código.
- Antes de cambiar código, lee completamente:
  - docs/03-sprints/sprint-12-operational-dashboard/README.md
  - docs/03-sprints/sprint-12-operational-dashboard/acceptance-and-test-plan.md
  - docs/03-sprints/sprint-12-operational-dashboard/approval.md
  - docs/04-calidad/definition-of-done.md
  - módulos appointments, work-orders, sales, payments, inventory, auth y los patrones API/web existentes.

Objetivo:
Implementa HU-63 a HU-65 y RF-CON-001 a RF-CON-005: una consulta operativa de solo lectura con resumen trazable, filtros y acceso a los detalles fuente. Al aprobar, el acumulado será 65/92 = 70,65%.

Decisiones obligatorias:
1. Es un módulo de lectura: no crear, editar, confirmar, cobrar, entregar ni modificar inventario, ventas, citas u órdenes.
2. Cada indicador debe identificar fuente, período, criterio de inclusión y permisos requeridos. Los montos usan el cálculo de saldo del servidor de payments; no reimplementes reglas en el cliente.
3. Incluye solo indicadores operativos trazables: citas, órdenes por estado, ventas confirmadas, saldos pendientes y alertas de stock. No incorpores gráficos BI, tendencias, exportaciones ni IA.
4. Los filtros se validan y aplican en API. Las listas se paginan. Un error o falta de permiso nunca se representa como cero.
5. La API verifica permisos de lectura de cada fuente. La interfaz muestra solo secciones autorizadas y los enlaces de detalle respetan sus guards.
6. Reutiliza detalles y rutas existentes. No expongas UUID internos ni copies reglas de negocio de módulos fuente.

API y datos:
- Implementa un módulo o composición de consulta operativa con tipos, schemas, repository, service, controller, routes, README y pruebas.
- Expón contratos tipados para resumen, filtros y listas de atención; define fechas y estados de cada métrica explícitamente.
- No apliques migraciones o seeds sin autorización expresa y no modifiques migraciones existentes.

Web:
- Crea una feature de dashboard operativo con servicio, hooks, filtros, tarjetas de resumen y listas de atención responsive/accesibles.
- Reutiliza formatos de moneda/fecha y estados loading, empty y error ya existentes.
- Implementa navegación a las fichas originales solo donde exista permiso.

Calidad y documentación:
- Añade pruebas de cálculo/trazabilidad, filtros, permisos, vacío, error y garantía de solo lectura.
- Ejecuta API typecheck/lint/tests; web typecheck/lint/tests/build; format:check y git diff --check. Reporta resultados reales.
- Actualiza los documentos del Sprint 12 y deja approval.md como “Listo para prueba del usuario”; no declares aprobación ni cambies el avance sin prueba manual y autorización expresa.
- No incluyas, borres ni modifiques .playwright-cli/, .playwright-mcp/, output/ ni tmp/.
- No hagas commit ni push.
```
