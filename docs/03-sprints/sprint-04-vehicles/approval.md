# Aprobación - Sprint 04

Estado: `Aprobado y cerrado`
Fecha de entrega: 2026-09-25
Fecha de prueba: 2026-09-25
Aprobado por: Usuario

## Verificación automatizada cumplida

- API: `prisma generate`, `tsc --noEmit`, `eslint`, `vitest` → 49 passed,
  20 skipped (integración activable con `DATABASE_TESTS=true`).
- Web: `tsc -b`, `eslint`, `vitest` → 133 passed, `build` ✓, `format:check` ✓.
- `git diff --check` sin errores; rama `feature/sprint-04-vehicles`.

## Prueba manual aprobada

1. Crear un vehículo y verificar normalización de placa (`abc-123` → `ABC123`).
2. Rechazo de placa duplicada (formato distinto) y de año fuera de rango.
3. Búsqueda por placa, propietario y documento; paginación.
4. Edición sin cambio de propietario (selector bloqueado).
5. Navegación Cliente ↔ Vehículo en ambas fichas.
6. Permisos de solo lectura (botones ocultos) y estados de interfaz.

- [x] HU-11 aprobada.
- [x] HU-12 aprobada.
- [x] HU-13 aprobada.
- [x] HU-14 aprobada.
- [x] Autorizado commit.
- [ ] Autorizado push.
- [x] Migraciones y seed aplicados en la BD de desarrollo.

Observaciones: Aprobados registro, normalización y unicidad de placas,
edición sin cambio de propietario, navegación Cliente ↔ Vehículo, búsqueda de
propietarios con nombre compuesto y los ajustes finales de selectores. El push
continúa pendiente de autorización expresa.
