# Criterios de aceptación y pruebas

| Escenario             | Resultado esperado                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------- |
| Pago mixto incompleto | `Dejar a crédito` se distingue como botón secundario con borde visible.                      |
| Pago mixto exacto     | El botón secundario se mantiene disponible y `Finalizar cobro` conserva la prioridad visual. |
| Pie del diálogo       | Cada botón adopta su ancho natural, sin forzar una anchura común.                            |

Prueba manual: abrir el modal de cobro, elegir Mixto e inspeccionar el pie con y sin diferencia pendiente.
