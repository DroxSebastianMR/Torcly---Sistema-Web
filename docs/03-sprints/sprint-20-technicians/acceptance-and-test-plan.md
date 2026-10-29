# Plan de aceptación y pruebas - Sprint 20

## Preparación

1. Iniciar sesión como administrador con `workshop:read` y `workshop:write`.
2. Aplicar la migración y semilla solo cuando el responsable lo autorice expresamente.
3. Registrar al menos dos técnicos activos y uno inactivo para las pruebas.

## Casos funcionales

| ID     | Acción                                                                          | Resultado esperado                                                                                           |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| S20-01 | Crear técnico con nombre completo.                                              | Se genera código único, queda activo y aparece en el listado. No se crea usuario ni acceso.                  |
| S20-02 | Crear técnico con documento, correo, teléfono, especialidades y notas.          | Se guardan los opcionales válidos; los campos vacíos quedan como `null`.                                     |
| S20-03 | Intentar crear/editar con documento o correo ya usado.                          | La API rechaza con error de unicidad claro; no duplica registros.                                            |
| S20-04 | Editar nombre, contacto, especialidades y notas.                                | El detalle y listado reflejan los cambios; se registra auditoría.                                            |
| S20-05 | Desactivar un técnico sin órdenes activamente asignadas.                        | Cambia a inactivo y desaparece de los selectores de asignación. La historia permanece visible.               |
| S20-06 | Intentar desactivar un técnico asignado a una orden activa.                     | La aplicación exige resolver la asignación según la regla definida; no deja datos ambiguos.                  |
| S20-07 | Crear o consultar una orden sin técnico.                                        | Muestra `Sin asignar` y el flujo de orden sigue permitido.                                                   |
| S20-08 | Asignar un técnico activo a una orden.                                          | La orden muestra nombre/código correcto, el filtro lo encuentra y se genera auditoría.                       |
| S20-09 | Reasignar y luego retirar el técnico de una orden.                              | La orden queda con el último estado seleccionado, incluida la opción `Sin asignar`; cada cambio se audita.   |
| S20-10 | Intentar asignar técnico inactivo, inexistente o UUID de usuario administrador. | La API rechaza la operación. Ningún administrador aparece como técnico.                                      |
| S20-11 | Consultar órdenes antiguas migradas desde usuarios.                             | Las asignaciones heredadas aparecen sin técnico; no se presentan administradores como técnicos.              |
| S20-12 | Revisar red, logs y auditoría.                                                  | No se exponen notas, correo, teléfono o documento en mensajes/logs; se conserva actor, operación y duración. |

## Cobertura automatizada mínima

- Schema: normalización, obligatorios, límites y formatos opcionales.
- Reglas: técnico activo, unicidad, asignación nullable y restricciones de desactivación.
- Servicio: CRUD operativo, auditoría y rechazo de UUID de `User` como técnico.
- Integración PostgreSQL gated: relaciones, índices, restricciones únicas y migración de órdenes heredadas.
- Web: estados loading/vacío/error, selector de técnicos, `Sin asignar`, formularios y confirmaciones.
- Calidad: typecheck, lint, tests, build, formato y `git diff --check`.
