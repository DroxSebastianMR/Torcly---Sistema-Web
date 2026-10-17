# Prompt de implementación - Sprint 14

```text
Implementa el Sprint 14 - Recomendaciones asistidas de reabastecimiento en Torcly.

Contexto:
- Repositorio: Torcly---Sistema-Web.
- Rama de trabajo: feature/sprint-14-ai-replenishment.
- La implementación se inicia solo con autorización explícita del usuario mientras las pruebas manuales de Sprints 11–13 estén pendientes.
- Antes de cambiar código, lee completamente:
  - docs/03-sprints/sprint-14-ai-replenishment/README.md
  - docs/03-sprints/sprint-14-ai-replenishment/acceptance-and-test-plan.md
  - docs/03-sprints/sprint-14-ai-replenishment/approval.md
  - docs/04-calidad/definition-of-done.md
  - módulos inventory, sales, work-orders, reports, auth y audit.

Objetivo:
Implementa HU-74 a HU-80 / RF-IA-001 a RF-IA-010: evaluar elegibilidad y generar recomendaciones explicables de reabastecimiento, con ejecuciones inmutables/versionadas, historial y permisos. Al aprobar, el acumulado será 80/92 = 86,96%.

Decisiones obligatorias:
1. La primera versión es un asistente determinista y explicable, no un LLM ni una integración externa. Nunca envíes datos a terceros sin autorización adicional.
2. Solo usa datos reales y confirmados: movimientos de inventario CONFIRMED, ventas confirmadas y consumos válidos. Excluye borradores, cancelados, simulaciones e inactivos.
3. La fórmula debe tener una versión estable. Expón demanda usada, stock actual, mínimo, cobertura objetivo, cantidad sugerida, prioridad y explicación; documenta cada redondeo.
4. Ejecutar crea una corrida persistida, inmutable y auditable con actor, período, estrategia/versión, entradas resumidas y resultados. Consultar histórico no recalcula resultados pasados.
5. Una recomendación no crea ni confirma compras, entradas, salidas, ajustes, cambios de mínimos ni movimientos de inventario. No desarrolles esos flujos.
6. API: inventory:read para consultar; inventory:write para ejecutar. Los guards web no sustituyen la autorización API.
7. Muestra datos insuficientes y no elegibilidad como explicaciones, nunca como recomendación cero engañosa.

API y datos:
- Crea módulo replenishment completo: types, schemas, rules, repository, service, controller, routes, README y pruebas.
- Agrega una migración nueva solo para ejecuciones/recomendaciones/auditoría; no modifiques migraciones existentes ni la apliques o ejecutes seed sin autorización expresa.
- Expón endpoints paginados para elegibilidad/listado, ejecutar corrida, detalle de corrida e historial. Valida período, cobertura y filtros en servidor.
- Protege operaciones críticas con transacción y clave de idempotencia si la corrida puede reintentarse.

Web:
- Crea feature replenishment con página, filtros, formulario de ejecución, resumen de elegibilidad, tabla explicable, detalle/historial y estados loading/empty/error/restricted.
- Reutiliza patrones de formatos, accesibilidad, permisos y componentes ya consolidados. No expongas UUIDs.

Calidad y documentación:
- Prueba elegibilidad, fórmula, datos insuficientes, exclusión de movimientos no confirmados, inmutabilidad, historial, permisos, idempotencia, filtros y garantía de cero efectos sobre stock/compras.
- Ejecuta API typecheck/lint/tests/prisma validate; web typecheck/lint/tests/build; format:check y git diff --check.
- Actualiza README de módulo y documentos de Sprint 14. Deja approval.md como “Listo para prueba del usuario”; no declares aprobación ni cambies el avance sin prueba manual y autorización expresa.
- No incluyas, borres ni modifiques .playwright-cli/, .playwright-mcp/, output/ ni tmp/. No hagas commit ni push.
```
