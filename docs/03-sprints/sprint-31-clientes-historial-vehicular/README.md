# Sprint 31: Alta Unificada de Clientes y Vehículos + Historial Clínico Automotriz

## 1. Información General
* **Asignado:** Desarrollador 1 (Dev 1)
* **Rama Base:** `team/develop`
* **Rama Feature:** `feature/sprint-31-clientes-historial-vehicular`
* **Estado:** Planificado / Listo para desarrollo

---

## 2. Objetivos del Negocio
1. **Eliminar el doble registro:** Permitir que el recepcionista del taller registre a un nuevo cliente y a su vehículo en un solo paso y con un solo clic, sin tener que cambiar de pantalla.
2. **Hoja de Vida / Historial Clínico Automotriz:** Permitir consultar el historial completo de cualquier vehículo por placa: órdenes pasadas, kilometrajes históricos, servicios realizados y repuestos sustituidos.
3. **Estandarización de Encabezados:** Implementar el componente unificado `<PageHeader />` en los módulos de Clientes y Vehículos basado en el patrón estándar de Ventas.

---

## 3. Historias de Usuario

### HU-31.1: Registro Atómico de Cliente con Vehículo
**Como** recepcionista de taller,  
**quiero** tener la opción de registrar los datos del vehículo dentro del formulario de alta de cliente,  
**para** no tener que ir al módulo de vehículos a crearlo por separado.

* **Criterios de Aceptación:**
  * En `CustomerFormModal`, se incluye el switch/checkbox: `¿Registrar vehículo ahora?`.
  * Al activarse, se despliegan los campos de vehículo: Placa (obligatoria, formateada), Marca, Modelo, Año, Color y Kilometraje inicial.
  * Al guardar, se ejecuta una transacción atómica que crea el Cliente y el Vehículo vinculado.
  * Si la creación de uno falla, no se crea ninguno (consistencia de datos).

### HU-31.2: Hoja de Vida / Historial Clínico por Vehículo
**Como** asesor de servicio o mecánico,  
**quiero** consultar la hoja de vida de un vehículo buscando por su placa o desde la lista de vehículos,  
**para** ver todas sus visitas anteriores, fallas reparadas y repuestos cambiados a lo largo del tiempo.

* **Criterios de Aceptación:**
  * Nueva pantalla o drawer de detalle: `Historial Clínico del Vehículo`.
  * Línea de tiempo visual (timeline) con fecha, orden de trabajo asociada, kilometraje registrado, técnico responsable, servicios realizados y repuestos consumidos.
  * Resumen superior con: Total de visitas al taller, gasto acumulado y último kilometraje reportado.

### HU-31.3: Estandarización de Encabezados (Clientes y Vehículos)
**Como** usuario del sistema,  
**quiero** que las pantallas de Clientes y Vehículos tengan la misma altura, tipografía y estilo de encabezado que el módulo de Ventas,  
**para** una experiencia visual uniforme y consistente.

---

## 4. Archivos Asignados y Límites de Código (Cero Conflictos)
* **Backend (`apps/api/`):**
  * `apps/api/src/modules/customers/` (controlador, servicio, DTO con soporte para objeto opcional `vehicle`).
  * `apps/api/src/modules/vehicles/` (servicio y controlador de timeline/historial clínico).
* **Frontend (`apps/web/`):**
  * `apps/web/src/features/customers/` (modal de cliente, hooks, tipos).
  * `apps/web/src/features/vehicles/` (vista/componente de historial clínico, timeline).
  * `apps/web/src/components/ui/page-header.tsx` (creación del componente reutilizable).
