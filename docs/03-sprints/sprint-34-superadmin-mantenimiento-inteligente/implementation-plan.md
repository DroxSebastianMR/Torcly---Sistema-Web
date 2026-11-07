# Plan de Implementación - Sprint 34

## 1. Backend (`apps/api`)

### Tarea 1.1: Endpoint y Middleware de Impersonación
* **Archivo:** `apps/api/src/modules/platform/platform.controller.ts` y `platform.service.ts`
  * Crear endpoint `POST /platform/organizations/:id/impersonate`:
    * Solo accesible para usuarios con rol `SUPER_ADMIN`.
    * Busca el usuario administrador de la organización objetivo.
    * Genera un JWT que contiene:
      ```json
      {
        "sub": "target_admin_user_id",
        "organizationId": "target_org_id",
        "impersonatedBy": "super_admin_id",
        "isImpersonation": true
      }
      ```
    * Registra en la tabla `AuditLog` el evento `IMPERSONATION_STARTED`.
  * Endpoint `POST /platform/exit-impersonation`:
    * Invalida la sesión temporal y devuelve las credenciales del Super Admin original.

### Tarea 1.2: Algoritmo de Mantenimiento Preventivo
* **Archivo:** `apps/api/src/modules/maintenance/maintenance.service.ts`
  * Crear servicio `getPreventiveMaintenanceAlerts(organizationId)`:
    * Consulta vehículos que hayan tenido órdenes de taller con servicios clasificados como preventivos (cambio de aceite, afinamiento, frenos).
    * Compara la fecha de la última orden (`currentDate - lastOrderDate >= 180 días` o kilometraje proyectado).
    * Clasifica en tres estados: `CRITICAL` (más de 6 meses), `WARNING` (entre 5 y 6 meses), `UP_TO_DATE`.
    * Retorna clientes con su número de teléfono, placa, marca y servicio recomendado.

---

## 2. Frontend (`apps/web`)

### Tarea 2.1: Banner Flotante de Soporte
* **Archivo:** `apps/web/src/features/navigation/components/impersonation-banner.tsx`
  * Detecta si el token de sesión tiene el flag `isImpersonation`.
  * Renderiza una barra superior fija en color ámbar:
    ```tsx
    <div className="sticky top-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-xs font-bold text-black">
      <div className="flex items-center gap-2">
        <Wrench className="size-4" />
        <span>Modo Soporte Activo · Visualizando como: {orgName}</span>
      </div>
      <Button size="sm" variant="outline" onClick={handleExitImpersonation}>
        Salir de Soporte
      </Button>
    </div>
    ```

### Tarea 2.2: Consola Super Admin (Impersonación y Métricas)
* **Archivo:** `apps/web/src/features/platform/pages/platform-dashboard-page.tsx`
  * Tarjetas de métricas: Talleres Activos, MRR Proyectado (S/), Talleres en Prueba.
* **Archivo:** `apps/web/src/features/platform/components/organizations-table.tsx`
  * Botón *"Asistir Taller"* que ejecuta la mutación `impersonateOrganization` y redirige a `/dashboard`.

### Tarea 2.3: Pantalla de Recordatorios Preventivos
* **Archivo:** `apps/web/src/features/maintenance/pages/maintenance-reminders-page.tsx`
  * Lista de clientes con alertas preventivas.
  * Botón *"Enviar WhatsApp"*:
    ```typescript
    const url = `https://wa.me/51${phone}?text=${encodeURIComponent(
      `Hola ${name}, en ${tallerName} nos preocupamos por tu ${vehicle.brand} ${vehicle.model} (${vehicle.plate}). Notamos que ya le toca su mantenimiento preventivo. ¿Te gustaría agendar una cita esta semana?`
    )}`
    ```
