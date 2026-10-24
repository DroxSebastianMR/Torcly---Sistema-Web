# Índice de prompts de implementación QA

No entregar este índice a una IA implementadora. Usar solo el prompt del paquete
que se vaya a ejecutar; así se evita mezclar correcciones independientes.

| Orden | Paquete                        | Prompt                                                      | Plan de aceptación                                           |
| ----- | ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 1     | QA-17 - Flujos críticos        | [Prompt](qa-17-critical-workflows/implementation-prompt.md) | [Plan](qa-17-critical-workflows/acceptance-and-test-plan.md) |
| 2     | QA-18 - Formularios y feedback | [Prompt](qa-18-forms-feedback/implementation-prompt.md)     | [Plan](qa-18-forms-feedback/acceptance-and-test-plan.md)     |
| 3     | QA-19 - Seguridad y precisión  | [Prompt](qa-19-security-precision/implementation-prompt.md) | [Plan](qa-19-security-precision/acceptance-and-test-plan.md) |

Todos los paquetes se implementan sobre `feature/qa-manual-corrections`, salvo
que se cree una rama hija explícitamente. No se ejecutan dos paquetes a la vez
en el mismo directorio de trabajo.
