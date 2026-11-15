# Plan de implementación

1. Aplicar Prettier a los archivos versionados de `apps` y `docs`.
2. Tipar los adaptadores de cotizaciones y los mocks de pruebas para eliminar `any` explícitos.
3. Añadir configuración de Vitest por paquete con ejecución secuencial de archivos.
4. Validar typecheck, lint, formato, build, esquema Prisma, estado de migraciones y pruebas.
5. Ejecutar la matriz manual antes de solicitar la integración.
6. Corregir la restricción parcial de caja abierta para que sea única por
   organización y no global, incluyendo el manejo de conflictos concurrentes.
