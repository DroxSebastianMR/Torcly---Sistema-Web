# Plan de aceptación y pruebas - Sprint 19

| ID     | Acción                                                    | Resultado esperado                                                               |
| ------ | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| S19-01 | Consultar resumen de ventas/stock/citas con datos reales. | Respuesta breve, contextual y con período, timestamp y fuentes enlazables.       |
| S19-02 | Preguntar algo sin evidencia disponible.                  | Declara falta de datos; no inventa montos, clientes, estados ni recomendaciones. |
| S19-03 | Consultar como usuario con permisos parciales.            | Contexto y enlaces excluyen módulos/datos no autorizados.                        |
| S19-04 | Intentar pedir crear/cancelar/modificar una operación.    | Rechaza claramente: asistente es solo lectura.                                   |
| S19-05 | Quitar `GROQ_API_KEY`, agotar cuota o forzar timeout.     | UI informa indisponibilidad sin perder dashboard ni exponer detalles/secretos.   |
| S19-06 | Enviar prompt demasiado largo o muchas solicitudes.       | Límite y rate limiting seguros; no se llama al proveedor fuera de cuota.         |
| S19-07 | Revisar logs y red del navegador.                         | Clave nunca llega a web; logs contienen solo metadata sanitizada.                |
| S19-08 | Ejecutar fake provider en tests.                          | Casos deterministas cubren contexto, permisos, fallback y contrato de respuesta. |

Además: typecheck, lint, tests, build, formato, diff, y prueba manual con proveedor real solo usando una clave de entorno autorizada.
