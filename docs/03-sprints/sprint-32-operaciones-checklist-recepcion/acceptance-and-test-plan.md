# Plan de Pruebas y Criterios de Aceptación - Sprint 32

## Matriz de Pruebas Manuales Paso a Paso

### Caso 1: Navegación de Taller por Pestañas (Tabs)
1. Ingresar al módulo de **Órdenes de taller**.
2. Observar las dos pestañas superiores: **"Órdenes de taller"** y **"Citas"**.
3. Hacer clic en **"Citas"**: La vista cambia instantáneamente a la lista/agenda de citas sin recargar la página.
4. Hacer clic en **"Órdenes de taller"**: Se muestra la tabla de órdenes y el widget de aforo de patio.
5. Copiar la URL con `?tab=citas` en una nueva pestaña: Abre directamente en la pestaña de citas.

### Caso 2: Atender Cita y Transición Fluida
1. Estando en la pestaña **"Citas"**, ubicar una cita confirmada.
2. Hacer clic en **"Atender / Iniciar orden"**.
3. Verificar que el modal de nueva orden abre con Cliente, Vehículo, Servicios y Kilometraje ya precargados.
4. Guardar la orden.
5. **Resultado esperado:** La vista conmuta automáticamente a la pestaña de **"Órdenes de taller"**, mostrando la nueva orden recién generada en patio.

### Caso 3: Registro y Visualización de Peritaje de Ingreso
1. Crear una orden de trabajo (directa o por cita).
2. En la sección *"Checklist de ingreso"*, seleccionar:
   * Combustible: `1/2 tanque`
   * Check en: `Llanta de repuesto`, `Gata y herramientas`
   * Daños previos: *"Raspón leve en puerta trasera derecha"*
3. Guardar la orden y abrir su modal de detalle.
4. **Resultado esperado:** La pestaña o bloque de "Inspección de ingreso" muestra exactamente el combustible, los checks de accesorios y la nota de daños.

### Caso 4: Verificación de Scroll en Dashboard
1. Navegar a la página de **Dashboard**.
2. Hacer scroll vertical hacia abajo hasta pasar el banner de bienvenida y la ilustración del robot.
3. **Resultado esperado:** El texto ("OPERACIÓN DE HOY", "Bienvenido de vuelta") y el robot pasan limpia y fluidamente **por debajo** de la cabecera fija, sin solaparse ni verse transparentados sobre la barra superior.

### Caso 5: Menú Lateral sin Compras ni Proveedores
1. Revisar la barra lateral izquierda de navegación.
2. **Resultado esperado:** Las opciones "Compras" y "Proveedores" ya no están visibles en el menú.
