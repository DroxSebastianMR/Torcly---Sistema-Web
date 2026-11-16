# Sprint 35: Cierre de calidad previo a producción

## Objetivo

Dejar estable la integración de los sprints 31 al 34 antes de aprobar su paso a `main`.

## Alcance

- Corregir errores de lint y formato detectados en la auditoría.
- Eliminar espacios finales para que `git diff --check` sea satisfactorio.
- Configurar Vitest para ejecutar la suite completa sin saturar los procesos locales.
- Ejecutar las validaciones automáticas y documentar una prueba manual de aceptación.

## Fuera de alcance

- No se modifican contratos funcionales, datos de producción ni migraciones.
- No se fusiona esta rama hacia `main` dentro de este sprint.
