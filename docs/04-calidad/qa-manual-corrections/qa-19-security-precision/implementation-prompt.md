# Prompt - QA-19 Seguridad y precisión

```text
Trabaja exclusivamente QA-19 sobre feature/qa-manual-corrections. No hagas
commit, push, migraciones, seed ni cambios de entorno.

Lee README.md y acceptance-and-test-plan.md de este directorio, el backlog QA y
los módulos auth, users, audit, products e inventory con sus pruebas.

Límites inviolables:
1. No muestres en login que una cuenta existe, está inactiva/bloqueada o cuánto
tiempo queda. Mantén respuesta no enumerativa.
2. QA-01 y QA-02 se verifican con auditoría/administración protegida y la guía
de prueba; no reduciendo seguridad.
3. QA-08: toda cantidad, incluida `und`, admite hasta tres decimales. Rechaza
cuatro o más decimales de forma coherente en web y API para producto, inventario,
venta, presupuesto, consumo y devolución. No redondees silenciosamente.
4. No cambies `Decimal(12,3)` ni crees migraciones: la precisión persistida ya
es adecuada.

Añade o ajusta pruebas seguras de bloqueo, inactivación, auditoría y respuesta
no enumerativa, además de pruebas de cantidades con 0, 1, 2, 3 y 4 decimales.
Ejecuta typecheck, lint, pruebas pertinentes, `pnpm format:check` y `git diff
--check`. No declares aprobado ningún sprint.
```
