# Prompt - QA-17 Flujos críticos

```text
Implementa exclusivamente QA-17 en Torcly, sobre feature/qa-manual-corrections.
No hagas commit, push, migraciones, seed ni cambios de entorno.

Lee README.md y acceptance-and-test-plan.md de este directorio, el backlog QA
global, definition-of-done y código/tests de appointments, work-orders,
inventory y cash/payments.

1. QA-05: reproduce primero nueve citas con nueve vehículos y exactamente la
misma fecha/hora. La API ya tiene límite 8 y advisory lock. Si no se reproduce,
no cambies la regla: documenta evidencia. Si se reproduce, corrige sin quitar
lock, capacidad, vehículo ocupado ni contrato.
2. QA-06: explica en el estado vacío que solo aparecen productos del presupuesto
aprobado pendientes de consumir. Prueba producto con stock -> presupuesto
aprobado -> consumo -> devolución. No permitas devolver sin consumo previo.
3. QA-07: conserva el string del importe mientras se escribe, incluido 100.00;
convierte y valida al confirmar o salir. Mantén saldo/API, máximo dos decimales,
idempotencia y requestId.

Añade pruebas de regresión. No tocar auth, clientes, 404 ni precisión de
unidades. No tocar .playwright-cli/, .playwright-mcp/, output/ ni tmp/.
Ejecuta API typecheck/lint/test; web typecheck/lint/test/build;
pnpm format:check y git diff --check. Actualiza los documentos con resultados
reales y entrega causa, archivos, comandos y pendientes PostgreSQL.
```
