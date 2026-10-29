# Estrategia de ramas y aprobaciones

## Cadena preparada

1. `main`
2. `feature/sprint-01-foundation-auth`
3. `feature/sprint-02-users-access`
4. `feature/sprint-03-customers`
5. `feature/sprint-04-vehicles`
6. `feature/sprint-05-products`
7. `feature/sprint-06-inventory-services`

Las seis referencias se prepararon desde la `origin/main` vigente (`3559381`). Cada rama se creó tomando como base la anterior. Mientras no existan commits autorizados, todas apuntan al mismo commit; la dependencia real se materializa cuando se aprueba y confirma cada sprint.

## Reglas

- No hacer commit ni push sin autorización expresa del usuario.
- Trabajar un sprint a la vez y dejar los cambios sin confirmar para revisión.
- Corregir observaciones en la misma rama.
- Tras la aprobación, solicitar autorización separada para commit y push.
- Crear o actualizar la siguiente rama desde el commit aprobado de la anterior.
- No mezclar alcance de dos sprints ni adelantar cambios en ramas posteriores.
- No fusionar a `main` sin aprobación explícita.
