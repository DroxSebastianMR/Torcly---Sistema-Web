# Plan de Pruebas y Criterios de Aceptación - Sprint 34

## Matriz de Pruebas Manuales Paso a Paso

### Caso 1: Acceso en Modo Soporte (Impersonación)
1. Iniciar sesión como usuario con rol `SUPER_ADMIN`.
2. Ingresar a la consola global de organizaciones (`/platform/organizations`).
3. Ubicar un taller cliente (ej: *"Grupo Mecatronic"*).
4. Hacer clic en el botón de acción **"Asistir Taller (Impersonar)"**.
5. **Resultado esperado:**
   * La interfaz cambia a la vista del taller seleccionado.
   * En la parte superior de la pantalla aparece la barra fija de color ámbar: *"Modo Soporte Activo · Visualizando como: Grupo Mecatronic"*.
   * Se pueden consultar las órdenes, clientes y stock tal como los ve el dueño del taller.

### Caso 2: Salir de Modo Soporte
1. Estando en la vista del taller bajo modo soporte, hacer clic en el botón **"Salir de Soporte"** de la barra superior.
2. **Resultado esperado:**
   * La sesión de soporte se destruye.
   * El sistema redirige inmediatamente a la consola global de Super Admin (`/platform/organizations`).
   * No quedan cookies ni tokens de impersonación residuales.

### Caso 3: Consulta de Alertas de Mantenimiento Preventivo
1. Entrar con un usuario de taller normal.
2. Navegar al módulo de **Mantenimiento Preventivo**.
3. Verificar la lista de vehículos:
   * Vehículos con más de 6 meses desde su último cambio de aceite aparecen clasificados como `CRITICAL` (color rojo o badge prioritario).
   * Muestra la última visita, kilometraje registrado y nombre del propietario.

### Caso 4: Envío de Recordatorio por WhatsApp
1. En la lista de recordatorios preventivos, hacer clic en el botón **"Enviar WhatsApp"** al lado de un cliente.
2. **Resultado esperado:**
   * Se abre WhatsApp Web o la app de WhatsApp en el móvil.
   * El mensaje aparece listo para enviar, saludando al cliente por su nombre y mencionando la placa y modelo de su vehículo con una invitación a agendar cita.

### Caso 5: Verificación de Métricas SaaS en Super Admin
1. En el panel de Super Admin, revisar las tarjetas superiores de KPI.
2. **Resultado esperado:** Muestra con exactitud la cantidad de organizaciones activas, el total de organizaciones suspendidas y el cálculo mensual de suscripciones activas (MRR en S/).
