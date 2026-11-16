# Criterios de aceptación y pruebas

| Escenario                               | Resultado esperado                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| Cotización con ítems sin cliente        | Se guarda como borrador sin mostrar una restricción de asociación.                  |
| Cotización con cliente y vehículo       | Solo se muestran vehículos del cliente seleccionado.                                |
| Conversión de cotización sin asociación | Abre el diálogo de completado y exige cliente más vehículo antes de crear la orden. |
| Cliente nuevo desde cotización          | Los campos usan etiquetas externas, ejemplos y dos secciones verdes numeradas.      |
| Orden directa con cliente nuevo         | Conserva exactamente el mismo lenguaje visual de secciones, etiquetas y ejemplos.   |

Prueba manual: crear una cotización sin cliente con un ítem, abrirla y convertirla asignando cliente/vehículo; repetir creando un cliente nuevo desde la cotización.
