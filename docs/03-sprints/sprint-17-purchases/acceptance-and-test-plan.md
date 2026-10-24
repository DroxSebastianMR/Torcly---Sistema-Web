# Plan de aceptación y pruebas - Sprint 17

## Preparación

1. Iniciar con un producto activo, unidad definida y stock conocido.
2. Crear un proveedor de prueba con documento único.
3. Usar un usuario con `purchases:write` y otro solo con `purchases:read`.

## Casos

| ID     | Acción                                                                          | Resultado esperado                                                                                                        |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| S17-01 | Crear, editar, buscar y desactivar proveedor.                                   | Documento único; datos requeridos claros y el proveedor inactivo no se ofrece para nuevas compras.                        |
| S17-02 | Crear compra borrador con dos productos, cantidades decimales válidas y costos. | Total se deriva de líneas; no se altera inventario.                                                                       |
| S17-03 | Enviar cantidad/costo inválido, producto inexistente o línea vacía.             | API rechaza con error uniforme y la UI conserva datos corregibles.                                                        |
| S17-04 | Confirmar la recepción una vez.                                                 | Compra pasa a `RECEIVED`, stock aumenta exactamente y existen movimientos `ENTRY` auditables.                             |
| S17-05 | Repetir la misma solicitud con el mismo `requestId` y luego con otro.           | Mismo `requestId` reproduce resultado sin duplicar; solicitud posterior incompatible se rechaza o no duplica existencias. |
| S17-06 | Intentar editar, borrar o cancelar una compra recibida.                         | Operación rechazada; historial permanece inmutable.                                                                       |
| S17-07 | Consultar como lector y como usuario sin permiso.                               | Lector consulta sin acciones; sin permiso recibe 403/ruta restringida.                                                    |
| S17-08 | Filtrar por proveedor, estado y período; abrir detalle.                         | Conteos, líneas, referencia y movimientos corresponden al historial.                                                      |

## Verificación técnica

- Unitarias para reglas, cálculos, transiciones, precisión e idempotencia.
- Integración PostgreSQL gated para rollback, doble confirmación y concurrencia.
- API/web: typecheck, lint, tests, build, `pnpm format:check` y `git diff --check`.
