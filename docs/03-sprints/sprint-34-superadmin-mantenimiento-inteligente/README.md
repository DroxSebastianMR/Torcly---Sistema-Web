# Sprint 34: Super Admin SaaS (Modo Soporte / Impersonate) + Recordatorios Inteligentes de Mantenimiento Preventivo

## 1. Información General
* **Asignado:** Líder de Proyecto / Usuario (USER) + Antigravity (Pair Programming)
* **Rama Base:** `team/develop`
* **Rama Feature:** `feature/sprint-34-superadmin-mantenimiento-inteligente`
* **Estado:** Planificado / Listo para desarrollo

---

## 2. Objetivos del Negocio
1. **Modo Suplantación / Soporte (Impersonate) en Super Admin:** Permitir al administrador de Torcly ingresar con 1 solo clic a la sesión de cualquier taller cliente para brindar soporte técnico inmediato y reproducir incidencias en vivo sin pedir contraseñas.
2. **Motor de Recordatorios Inteligentes de Mantenimiento:** Analizar el kilometraje y fechas de visitas anteriores de los vehículos para detectar automáticamente cuándo les toca su próximo cambio de aceite o afinamiento preventivo (ej: 5,000 km o 6 meses), generando listas de contacto para WhatsApp.
3. **Métricas Globales SaaS:** Incorporar métricas comerciales en la consola de Super Admin (talleres activos, MRR estimado, distribución de planes Básico, Pro y Corporativo).

---

## 3. Historias de Usuario

### HU-34.1: Acceso en Modo Soporte (Impersonate)
**Como** Super Administrador de Torcly SaaS,  
**quiero** acceder a la cuenta de un taller cliente con un clic desde la consola de organizaciones,  
**para** ayudarles con sus consultas y verificar errores sin pedirles sus credenciales.

* **Criterios de Aceptación:**
  * En la tabla de organizaciones del Super Admin (`/platform/organizations`), botón de acción *"Asistir Taller (Impersonar)"*.
  * Al hacer clic, se genera un token de sesión de soporte y se redirige a la vista del taller.
  * Se visualiza permanentemente en la parte superior un banner flotante ámbar:
    `🔧 Modo Soporte Activo: Visualizando como "[Nombre Taller]" · [Salir de Soporte]`.
  * Todas las acciones quedan auditadas bajo `IMPERSONATED_BY_ADMIN`.
  * Al hacer clic en *"Salir de Soporte"*, se destruye la sesión temporal y regresa a la consola de Super Admin.

### HU-34.2: Motor de Alertas Preventivas de Taller
**Como** dueño del taller o recepcionista,  
**quiero** ver qué clientes tienen vehículos con mantenimientos vencidos o por vencer,  
**para** enviarles un mensaje de WhatsApp y agendar su retorno al taller.

* **Criterios de Aceptación:**
  * Módulo o pestaña de "Mantenimiento Preventivo" en Clientes/Vehículos.
  * Algoritmo: Detecta vehículos cuya última orden de mantenimiento superó los 5,000 km o tiene más de 6 meses de antigüedad.
  * Tarjetas de cliente con botón directo: *"Enviar recordatorio por WhatsApp"* con plantilla personalizada del taller.

### HU-34.3: Métricas Globales SaaS en Super Admin
**Como** fundador del SaaS,  
**quiero** visualizar el MRR (ingresos mensuales recurrentes), número total de talleres activos y distribución de planes contratados,  
**para** tener visibilidad financiera de la plataforma.

---

## 4. Archivos Asignados y Límites de Código (Cero Conflictos)
* **Backend (`apps/api/`):**
  * `apps/api/src/modules/platform/` (endpoints de impersonación y métricas SaaS).
  * `apps/api/src/modules/maintenance/` (nuevo módulo de alertas predictivas de mantenimiento).
* **Frontend (`apps/web/`):**
  * `apps/web/src/features/platform/` (consola de Super Admin, métricas MRR, botón de impersonación).
  * `apps/web/src/features/maintenance/` (pantalla de recordatorios preventivos y botón WhatsApp).
  * `apps/web/src/components/layout/` o `features/navigation/` (`impersonation-banner.tsx`).
