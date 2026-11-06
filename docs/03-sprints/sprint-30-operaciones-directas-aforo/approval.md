# Acta de Cierre y Aprobación — Sprint 30: Operaciones Directas y Aforo de Patio

## 1. Información General

- **Sprint:** 30
- **Nombre:** Operaciones Directas en Recepción y Aforo Diario de Patio
- **Rama:** `feature/sprint-30-bay-capacity-direct-work-orders`
- **Fecha de Inicio:** 6 de noviembre de 2026
- **Estado:** En desarrollo

---

## 2. Checklist de Verificación DoD (Definition of Done)

- [ ] Modelo relacional `WorkOrder` adaptado con `appointmentId` opcional, `currentMileage`, `fuelLevel`, `source` y `receptionNotes`.
- [ ] Modelo `Vehicle` con campo `mileage` para persistencia de odómetro.
- [ ] Endpoints de creación directa (`POST /api/v1/work-orders/direct`) y métricas de patio (`GET /api/v1/work-orders/yard-capacity`).
- [ ] Actualización del flujo de recepción de citas con registro de odómetro y combustible.
- [ ] Widget visual de Aforo de Patio (8 bahías) integrado en interfaz web con alertas de saturación.
- [ ] Modal de Orden Directa con selectores Torcly y sin iconos superiores en la cabecera.
- [ ] Pruebas unitarias de esquemas, servicios y componentes en `@torcly/api` y `@torcly/web`.
- [ ] TypeScript `typecheck` con 0 errores en ambos proyectos.
- [ ] Suites de pruebas automáticas 100% en verde.
- [ ] Formateo con Prettier verificado.

---

## 3. Firmas de Aprobación

- **Responsable de Implementación:** Agente Antigravity
- **Aprobado por el Usuario:** Pendiente de verificación final
