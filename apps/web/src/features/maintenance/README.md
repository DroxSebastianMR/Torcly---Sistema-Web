# Maintenance (web)

Señal de mantenimiento planificado y administración de ventanas.

- `MaintenanceBanner` se muestra en el área autenticada solo cuando la ventana está en curso (`status: 'active'`); comunica el mensaje y el rango. No bloquea la navegación: es una señal informativa.
- La página `/mantenimiento` (permiso `maintenance:read`) lista las ventanas programadas. Con `maintenance:write` permite programar (inicio, fin y mensaje) y cancelar con confirmación.
- El formulario valida localmente que las fechas existan y el mensaje tenga al menos 5 caracteres, coherente con la API; los errores se muestran con los mensajes del servidor.
- El estado de la ventana lo determina la API; la UI no recalcula ni falsifica disponibilidad.

Sprint propietario: 16 (HU-83).
