# Plan de aceptación - Sprint 09 Fundación de operación de taller

## Estado

Prueba manual completada y aprobada por el usuario, con verificación automatizada en verde (171 unitarios API + 274 web, typecheck, lint, build y formato).

## Preparación

1. Aplicar las migraciones del Sprint 09 y ejecutar la semilla cuando el incremento esté listo para probar.
2. Iniciar sesión como administrador y confirmar acceso a **Citas**, **Órdenes de taller**, **Productos** y **Servicios**.
3. Tener una cita futura o actual `PROGRAMADA` con cliente y vehículo reales, dos productos activos, un servicio activo y al menos un usuario activo para asignar como técnico.

## Datos de prueba sugeridos

| Dato        | Valor sugerido                                                                            |
| ----------- | ----------------------------------------------------------------------------------------- |
| Cliente     | Prueba Natural Sprint03                                                                   |
| Vehículo    | ABC123 - Toyota Corolla Cross                                                             |
| Cita        | CITA-000001, programada y no atendida                                                     |
| Técnico     | Arian (usuario administrador activo)                                                      |
| Diagnóstico | Filtro de aceite saturado; revisar sistema de frenos y realizar mantenimiento preventivo. |
| Producto    | Filtro de aceite Mann W 712/83, 1 und, S/ 42.50                                           |
| Servicio    | Mantenimiento preventivo, 1 und, S/ 195.00                                                |

Sustituye los valores si no existen en la base de prueba. Los productos y servicios seleccionados deben estar activos.

## Casos principales

| Caso                      | Acción                                                                                                              | Resultado esperado                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Atender cita              | Abrir una cita `PROGRAMADA` y usar **Atender y crear orden**.                                                       | Se crea una sola orden `OT-######`, con el mismo cliente y vehículo; la cita queda `ATENDIDA`.     |
| Evitar duplicado          | Intentar atender nuevamente la misma cita.                                                                          | Rechaza la acción o la oculta; no genera una segunda orden.                                        |
| Diagnóstico               | Registrar el texto sugerido y guardarlo.                                                                            | La orden cambia a `EN_DIAGNOSTICO`; el texto queda visible en su ficha.                            |
| Técnico                   | Asignar el usuario activo sugerido y luego cambiarlo, si hay otro.                                                  | La ficha refleja el técnico vigente y la auditoría conserva el cambio.                             |
| Presupuesto               | Agregar el producto y el servicio sugeridos, verificar cantidades, subtotales y total, y guardar/enviar.            | Se conservan precio, descripción y total de la cotización; queda `PENDIENTE_APROBACION`.           |
| Sin efectos de inventario | Consultar Inventario antes y después de guardar/enviar el presupuesto.                                              | No se crea ninguna salida ni se modifica la existencia.                                            |
| Aprobación                | Aprobar el presupuesto con una observación.                                                                         | Estado `APROBADA`, decisión, fecha y responsable visibles; no inicia ejecución ni descuenta stock. |
| Rechazo                   | Repetir con una nueva orden y rechazar su presupuesto.                                                              | Estado `RECHAZADA`; la orden y presupuesto siguen consultables.                                    |
| Reglas de presupuesto     | Intentar enviar sin líneas, con cantidad cero o seleccionar un catálogo inactivo.                                   | La interfaz y API rechazan los datos inválidos.                                                    |
| Consulta                  | Buscar por código, cliente, placa y técnico; filtrar por estado.                                                    | La lista presenta solo las órdenes coincidentes y abre su detalle correcto.                        |
| Permisos                  | Con un usuario sin escritura, cuando esté disponible, intentar atender, editar diagnóstico, presupuesto o decisión. | Puede consultar con lectura, pero no cambiar datos sin `workshop:write`.                           |

## Evidencia mínima

- Una cita marcada como atendida y su orden `OT-######` asociada.
- Diagnóstico, técnico y presupuesto con una línea de producto y otra de servicio.
- Una orden aprobada y otra rechazada, ambas con responsable y fecha de decisión.
- Evidencia de que no hubo movimiento de inventario al presupuestar o aprobar.
- Resultado de migraciones, pruebas automatizadas, typecheck, lint, build, formato y `git diff --check`.
