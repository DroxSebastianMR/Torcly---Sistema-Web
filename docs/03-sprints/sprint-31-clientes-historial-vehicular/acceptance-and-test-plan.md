# Plan de Pruebas y Criterios de Aceptación - Sprint 31

## Matriz de Pruebas Manuales Paso a Paso

### Caso 1: Alta de Cliente SIN Vehículo (Flujo Tradicional)
1. Ir al módulo de **Clientes**.
2. Hacer clic en **"Registrar cliente"**.
3. Dejar desmarcada la opción *"¿Registrar vehículo ahora?"*.
4. Llenar los datos del cliente (Nombre, Teléfono, Documento) y presionar "Guardar".
5. **Resultado esperado:** El cliente se crea exitosamente, aparece en la lista de clientes y no se genera ningún vehículo huérfano.

### Caso 2: Alta Atómica de Cliente CON Vehículo
1. Ir al módulo de **Clientes**.
2. Hacer clic en **"Registrar cliente"**.
3. Llenar datos del cliente (Ej: "Carlos Mendoza", DNI: 71234567).
4. Activar el switch *"¿Registrar vehículo ahora?"*.
5. Llenar los datos del vehículo:
   * Placa: `ABC-789`
   * Marca: `Toyota`
   * Modelo: `Corolla`
   * Kilometraje: `45000`
6. Presionar "Guardar cliente".
7. **Resultado esperado:**
   * Notificación de éxito: *"Cliente y vehículo registrados correctamente"*.
   * El cliente aparece en la tabla de clientes.
   * Al ir al módulo de **Vehículos**, el auto `ABC-789` ya existe en el catálogo y está asociado a Carlos Mendoza.

### Caso 3: Consulta de Historial Clínico Automotriz
1. Ir al módulo de **Vehículos**.
2. Ubicar un vehículo que tenga órdenes de taller previas.
3. En el menú de acciones (`...`), seleccionar **"Ver historial clínico"**.
4. **Resultado esperado:**
   * Se abre el modal o vista de Hoja de Vida.
   * Se muestra la línea de tiempo ordenada de más reciente a más antigua.
   * Se detallan las fechas, los kilometrajes registrados, los servicios realizados y los repuestos cambiados en cada visita.

### Caso 4: Verificación Visual de Encabezados Estandarizados
1. Abrir la pantalla de **Clientes**.
2. Abrir la pantalla de **Vehículos**.
3. Comparar ambas con la pantalla de **Ventas**.
4. **Resultado esperado:** Las alturas de cabecera, espaciados superiores e inferiores, tamaños de fuente y color del eyebrow (`text-primary`, uppercase) son 100% idénticos entre los tres módulos.
