# Criterios de aceptación y pruebas

| Caso                                   | Resultado esperado                                                                                                                                        |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pago mixto S/ 400 con S/ 100 y S/ 200  | Se informa que faltan S/ 100 y no se permite finalizar.                                                                                                   |
| Pago mixto S/ 400 con S/ 100 y S/ 300  | Se permite finalizar y se envían ambos pagos.                                                                                                             |
| Edición de S/ 100 en el primer importe | El valor se visualiza como `100`, sin prefijo `0`.                                                                                                        |
| Saldo por cobrar                       | El usuario puede elegir explícitamente `Dejar pendiente (Crédito)`; si ya indicó S/ 300, se registra ese pago y queda pendiente únicamente la diferencia. |

Prueba manual: abrir una venta de S/ 400, seleccionar Mixto, ingresar los dos importes de cada caso y comprobar el mensaje, el estado del botón y el resultado de cada acción.
