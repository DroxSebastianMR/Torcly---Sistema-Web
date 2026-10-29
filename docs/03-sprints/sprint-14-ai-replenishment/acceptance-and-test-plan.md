# Plan de aceptación - Sprint 14 Reabastecimiento asistido

## Estado

**Cerrado por autorización del usuario el 16 oct. 2026.** La migración `20261020000000_add_replenishment` se aplicó mediante `pnpm db:migrate:deploy`. Este plan se conserva para registrar evidencia manual complementaria con datos confirmados suficientes. Las verificaciones automatizadas ya están en verde: typecheck, lint, tests unitarios (API 23, web 36) y build web.

## Preparación

1. Tener productos activos con existencias distintas, mínimos definidos y movimientos `CONFIRMED` durante el período de prueba.
2. Contar con al menos un producto sin historial suficiente y otro inactivo, para comprobar no elegibilidad.
3. Iniciar sesión con `inventory:read`; usar una cuenta con `inventory:write` solo para probar la ejecución.

## Casos principales

| Caso         | Acción                                                                    | Resultado esperado                                                                    |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Elegibilidad | Consultar productos con historial, sin historial e inactivos.             | Cada producto explica si puede recomendarse y por qué.                                |
| Ejecución    | Ejecutar una corrida con período válido y cobertura objetivo.             | Se crea una ejecución versionada, con actor, fecha, criterio y resultados inmutables. |
| Cálculo      | Contrastar un producto contra sus movimientos confirmados y stock actual. | Cantidad, prioridad y explicación coinciden con la fórmula documentada.               |
| Historial    | Abrir una corrida pasada tras registrar nuevos movimientos.               | Conserva el resultado original y no se recalcula silenciosamente.                     |
| Filtros      | Buscar por producto, prioridad, elegibilidad o fecha.                     | El servidor pagina y devuelve solo resultados compatibles.                            |
| Permisos     | Probar lectura sin escritura y usuario sin inventario.                    | Solo quien tiene escritura ejecuta; API no entrega datos restringidos.                |
| Seguridad    | Inspeccionar acciones posteriores a recomendar.                           | No se crea compra, entrada, ajuste ni movimiento de inventario.                       |
| Error/vacío  | Usar período sin datos o provocar error de API.                           | Estado claro, recuperable y sin recomendación inventada.                              |

## Evidencia mínima

- Una ejecución elegible con resultado explicado y una fila no elegible.
- Comparación de demanda/stock con los movimientos fuente.
- Historial que conserve una ejecución tras nuevos movimientos.
- Ausencia de movimientos de inventario, compras o ajustes causados por la recomendación.
- Resultado de pruebas, typecheck, lint, build, formato y `git diff --check`.
