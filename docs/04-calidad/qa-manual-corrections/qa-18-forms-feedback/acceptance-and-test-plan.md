# Plan de aceptación - QA-18 Formularios y feedback

## QA-03 - Cliente jurídico

1. Abrir Registro de cliente y escoger Persona jurídica.
2. Provocar error con RUC incompleto.
3. Completar RUC de 11 dígitos, razón social y teléfono válidos.
4. Volver a dejar el RUC inválido.

Esperado: el error desaparece al corregir y reaparece cuando corresponde; no se
borran otros campos y API mantiene su validación al enviar.

## QA-04 - Ruta inexistente

1. Abrir una ruta inexistente dentro de la aplicación.
2. Recorrer la pantalla con teclado y activar "Volver al inicio".
3. Comprobar por prueba de componente que el error inesperado sigue diferenciado.

Esperado: la página incluye `Error 404`, explicación comprensible y retorno.

Ejecutar web typecheck/lint/test/build, `pnpm format:check` y `git diff --check`.
