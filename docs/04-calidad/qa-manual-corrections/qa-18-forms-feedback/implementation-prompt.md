# Prompt - QA-18 Formularios y feedback

```text
Implementa exclusivamente QA-18 en Torcly, sobre feature/qa-manual-corrections.
No hagas commit, push, migraciones, seed ni cambios de entorno.

Lee README.md y acceptance-and-test-plan.md de este directorio, el backlog QA y
formularios/tests de customers, router y system-feedback-screen.

1. QA-03: tras un error, un RUC válido de 11 dígitos debe revalidar y retirar de
inmediato el mensaje. No borres otros valores ni relajes validación de API,
duplicados, razón social o teléfono.
2. QA-04: añade una señal visible y accesible `Error 404` para ruta inexistente.
Conserva mensaje amigable, retorno al inicio y distinción del error inesperado.

Añade pruebas que fallen antes y pasen después. No tocar citas, taller, caja,
auth ni precisión de cantidades. No tocar .playwright-cli/, .playwright-mcp/,
output/ ni tmp/. Ejecuta web typecheck/lint/test/build, pnpm format:check y git
diff --check. Actualiza documentos con resultados reales.
```
