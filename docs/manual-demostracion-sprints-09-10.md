# Manual de demostración — Sprints 09 y 10

Duración sugerida: 8 a 10 minutos.

Este guion usa la rama `demo/offline-sprints-09-10`. El modo demo es local: no inicia la API ni necesita Internet, PostgreSQL o Supabase. Sus cambios se guardan únicamente en la memoria del navegador; para reiniciar la demostración, recarga la página.

## 1. Preparar la demo

1. Abrir una terminal en la raíz del proyecto.
2. Confirmar que se usa la rama de demo:

   ```sh
   git switch demo/offline-sprints-09-10
   ```

3. Iniciar la aplicación:

   ```sh
   pnpm demo
   ```

4. Abrir `http://127.0.0.1:5173`.
5. Iniciar sesión con:

   | Campo            | Valor               |
   | ---------------- | ------------------- |
   | Usuario o correo | `demo@torcly.local` |
   | Contraseña       | `DemoTorcly2026!`   |

6. Explicar brevemente: “Estamos usando una cuenta local de presentación con permisos completos; no hay comunicación con una red externa.”

## 2. Introducir el caso de negocio

En el menú lateral, abrir **Citas**.

1. Mostrar `CITA-000001`, que ya está **Atendida** y corresponde al vehículo `ABC123 · Toyota Corolla Cross`.
2. Explicar que una cita atendida genera una única orden de taller, evitando duplicar trabajos para el mismo ingreso.
3. Mostrar `CITA-000002` como una cita **Programada**. Sirve para evidenciar que la agenda y la operación del taller están conectadas, pero son etapas distintas.
4. Indicar que el caso principal de la demo ya avanzó desde la atención de la cita para dedicar el tiempo a las funcionalidades de las órdenes y de la ejecución.

## 3. Demostrar el Sprint 09 — Orden de taller

Abrir **Órdenes de taller** y hacer clic en `OT-000001`.

1. Mostrar los datos principales de la orden:
   - Cita de origen: `CITA-000001`.
   - Cliente: `Mariana Salazar Vega`.
   - Vehículo: `ABC123 · Toyota Corolla Cross`.
   - Técnico: `Presentador Torcly`.
2. Señalar el diagnóstico: explica el problema o la necesidad detectada antes de intervenir el vehículo.
3. Mostrar el presupuesto:
   - Producto: filtro de aceite Mann W 712/83.
   - Servicio: mantenimiento preventivo.
   - Total: S/ 237.50.
4. Explicar que los precios quedan almacenados en la orden: si después cambia el precio del catálogo, el presupuesto histórico no se altera.
5. Mostrar que la orden tiene un técnico asignado y que fue aprobada antes de iniciar el trabajo.

Mensaje sugerido: “El Sprint 09 organiza el flujo administrativo: cita atendida, diagnóstico, presupuesto, aprobación del cliente y asignación del técnico.”

## 4. Demostrar el Sprint 10 — Ejecución de trabajo

La orden inicia en estado **En ejecución** para ir directamente a las acciones operativas.

### 4.1 Registrar y completar una actividad

1. En la ficha de `OT-000001`, presionar **Registrar actividad**.
2. Escribir: `Reemplazo de filtro de aceite y verificación de nivel de lubricante.`
3. Guardar la actividad.
4. Verificar que aparece en la cronología con el responsable y la fecha.
5. Usar **Completar actividad** sobre la actividad recién creada.
6. Explicar que las actividades permiten conocer el avance técnico, no solo el estado general de la orden.

### 4.2 Registrar el consumo de un repuesto

1. Presionar **Registrar consumo**.
2. Elegir la línea del filtro Mann W 712/83.
3. Registrar cantidad `1`.
4. Confirmar el consumo.
5. Mostrar que el panel de ejecución refleja la cantidad consumida.
6. Abrir **Inventario** en otra pestaña o cerrar el detalle y abrir Inventario.
7. En **Historial**, verificar la salida asociada a la orden; en **Existencias**, comprobar que el stock del filtro disminuyó en una unidad.

Mensaje sugerido: “El consumo no es solo una nota: crea una salida de inventario trazable hacia la orden de taller.”

### 4.3 Demostrar una devolución (opcional, recomendado)

1. Volver a `OT-000001` y presionar **Registrar devolución**.
2. Elegir el filtro, cantidad `1`, y escribir: `Repuesto devuelto para demostración.`
3. Confirmar la devolución.
4. Abrir **Inventario** y mostrar el ajuste de ingreso generado.
5. Volver a consumir una unidad del filtro para dejar la orden con su consumo final registrado.

Explicar: “La devolución no borra la salida original; registra un movimiento compensatorio. Eso mantiene la auditoría completa.”

### 4.4 Finalizar y entregar el vehículo

1. Volver a la ficha de la orden.
2. Verificar que todas las actividades estén completadas.
3. Presionar **Finalizar trabajo** y confirmar.
4. Mostrar el cambio de estado a **Lista para entrega**.
5. Presionar **Registrar entrega**.
6. Escribir esta observación:

   ```text
   Vehículo entregado; se explicó al cliente el mantenimiento realizado.
   ```

7. Confirmar la entrega.
8. Mostrar el estado final **Entregada**, el responsable, la fecha y la observación.

Mensaje sugerido: “Una vez entregada, la orden queda cerrada y ya no permite modificaciones operativas.”

## 5. Mostrar el historial técnico

1. Abrir **Vehículos**.
2. Seleccionar `ABC123 · Toyota Corolla Cross`.
3. En la ficha, ubicar **Historial técnico**.
4. Mostrar la entrada de `OT-000001` con:
   - Diagnóstico.
   - Técnico asignado.
   - Actividades realizadas.
   - Repuesto consumido.
   - Total de la intervención.

Mensaje sugerido: “El historial técnico permite que una futura atención conozca los trabajos anteriores sin depender de papeles o de la memoria del operario.”

## 6. Cierre sugerido

“El Sprint 09 construyó la orden de taller y formalizó el flujo de diagnóstico, presupuesto y aprobación. El Sprint 10 llevó esa orden a la operación real: actividades, consumo y devolución de repuestos, control de inventario, entrega e historial por vehículo. Con ello obtenemos trazabilidad desde la cita hasta la entrega del automóvil.”

## Reiniciar la demo

Si se necesita repetir el recorrido, recargar el navegador. Todos los datos locales volverán al estado inicial: `OT-000001` estará nuevamente **En ejecución**.
