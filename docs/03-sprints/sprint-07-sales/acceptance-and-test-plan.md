# Plan de aceptación — Sprint 07 Ventas

## Preparación

1. Aplicar las migraciones del Sprint 07 cuando existan y ejecutar la semilla de datos de prueba.
2. Iniciar API y web, iniciar sesión como administrador y comprobar acceso a **Ventas**.
3. Contar con al menos dos productos activos con stock disponible y un servicio activo. Un producto debe tener una existencia baja para probar el rechazo por insuficiencia.

## Casos principales

| Caso               | Acción                                                                | Resultado esperado                                                              |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Venta sin cliente  | Crear una venta, no seleccionar cliente y añadir un producto.         | El borrador se guarda o permite continuar sin cliente.                          |
| Producto válido    | Añadir un producto activo con cantidad menor o igual a su existencia. | Aparece una línea con precio, subtotal y total correctos.                       |
| Stock insuficiente | Solicitar una cantidad mayor a la existencia.                         | No permite confirmar y muestra un mensaje entendible; no cambia el stock.       |
| Servicio activo    | Añadir un servicio activo.                                            | La línea se integra al total sin descontar inventario.                          |
| Recalcular         | Cambiar cantidades y eliminar una línea.                              | Subtotales y total se actualizan de inmediato y son correctos.                  |
| Confirmación       | Confirmar una venta con producto y servicio.                          | Cambia a confirmada, registra auditoría y descuenta cada producto una sola vez. |
| Doble confirmación | Reintentar confirmar la misma venta.                                  | No duplica movimientos ni vuelve a descontar existencias.                       |
| Consulta           | Buscar la venta y abrir su detalle.                                   | Se ven cliente si existe, líneas, importes, estado, fecha y responsable.        |
| Permisos           | Probar con un perfil sin escritura, cuando esté disponible.           | Puede consultar si tiene lectura, pero no crear ni confirmar.                   |

## Evidencia mínima

- Identificador de la venta confirmada.
- Existencia de cada producto antes y después de confirmar.
- Captura o registro del detalle de la venta y del movimiento de inventario asociado.
- Resultado de pruebas automatizadas y verificaciones de calidad.
