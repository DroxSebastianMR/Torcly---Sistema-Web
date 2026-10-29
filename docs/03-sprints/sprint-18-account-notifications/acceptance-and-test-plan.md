# Plan de aceptación y pruebas - Sprint 18

| ID     | Acción                                                                   | Resultado esperado                                                                           |
| ------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| S18-01 | Abrir Perfil y actualizar datos permitidos.                              | Se actualiza solo la cuenta autenticada; validaciones y mensajes son claros.                 |
| S18-02 | Intentar editar perfil ajeno por URL/API.                                | API rechaza sin filtrar datos ni permitir cambios.                                           |
| S18-03 | Cambiar contraseña con actual errónea/válida.                            | Error seguro en el primer caso; sesiones se gestionan conforme a auth en el segundo.         |
| S18-04 | Generar un evento operativo habilitado y abrir Notificaciones.           | Aviso con texto comprensible, fecha y enlace autorizado al origen.                           |
| S18-05 | Marcar una/todas como leídas y recargar.                                 | Estado persiste; repetir acción no produce duplicados ni error.                              |
| S18-06 | Consultar como usuario sin permiso sobre el origen.                      | No recibe notificación ni enlace que revele la entidad.                                      |
| S18-07 | Buscar “códigos de barras”, visitar su URL y revisar menú.               | No aparece el módulo; ruta queda eliminada/404 controlado; `Product.barcode` sigue editable. |
| S18-08 | Provocar fallo controlado de creación de notificación durante operación. | Operación crítica mantiene consistencia y se registra el fallo seguro.                       |

Verificar además typecheck, lint, tests, build, formato, diff e integraciones PostgreSQL que correspondan.
