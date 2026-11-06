# Sprint 28 — Suscripciones y Membresías Comerciales SaaS

## 1. Contexto y Objetivos

Torcly opera como una plataforma SaaS multitenant para la gestión integral de talleres automotrices. De acuerdo con la arquitectura base descrita en `docs/02-arquitectura/administracion-plataforma.md`:

- La **suscripción pertenece a la Organización (el taller)**, no a usuarios individuales.
- El modelo comercial contempla planes diferenciados según el tamaño operativo del taller, con cuotas máximas de usuarios (miembros), catálogo de técnicos y volumen de inventario.
- Los límites deben ser **validados en el servidor** para proteger los recursos y garantizar el cumplimiento del contrato SaaS, no únicamente en la interfaz visual.
- El Administrador de Plataforma debe contar con una consola centralizada para supervisar los estados de suscripción de cada organización, gestionar upgrades/downgrades de plan, ajustar vigencias y monitorear cuotas de uso.
- Los dueños y administradores del taller deben disponer de una vista clara de su suscripción activa, estado de vigencia y barras de consumo de sus límites contratados.

El objetivo del **Sprint 28** es implementar el modelo completo de **Suscripciones y Membresías**, abarcando base de datos, API REST, control de cuotas en servidor, módulo de gestión en la consola de plataforma y panel de consulta para los talleres.

---

## 2. Alcance Funcional

### A. Catálogo de Planes SaaS (`Plan`)

- Modelo relacional para definir planes comerciales:
  - **STARTER (Plan Inicial)**: Orientado a talleres emergentes o mecánicos independientes.
    - Cuotas: hasta 3 miembros, hasta 5 técnicos, hasta 250 productos.
    - Ciclo mensual / anual referencial.
  - **PRO (Plan Profesional)**: Taller mediano con equipo técnico y recepción.
    - Cuotas: hasta 10 miembros, hasta 15 técnicos, hasta 2,500 productos.
    - Incluye asistente IA y analítica operativa avanzada.
  - **ENTERPRISE (Plan Corporativo)**: Taller de gran escala o cadena automotriz.
    - Cuotas: hasta 50 miembros, hasta 50 técnicos, hasta 20,000 productos.
    - Soporte prioritario y acceso a todas las capacidades de la plataforma.

### B. Suscripción por Organización (`OrganizationSubscription`)

- Cada taller tiene una suscripción asociada que registra:
  - `planId`: Plan asignado.
  - `status`: Estado de la suscripción (`ACTIVE`, `TRIAL`, `PAST_DUE`, `CANCELED`, `SUSPENDED`).
  - `billingCycle`: Ciclo de facturación (`MONTHLY`, `ANNUAL`).
  - `startsAt`: Fecha de inicio.
  - `renewsAt`: Fecha de renovación / próximo corte.
  - `canceledAt`: Fecha de cancelación (si aplica).
  - `notes`: Observaciones administrativas del equipo de plataforma.

### C. Control de Cuotas en Servidor (Enforcement)

- Al crear o invitar nuevos miembros a la organización (`POST /api/v1/platform/organizations/:id/members`), el servidor verifica el conteo de miembros activos versus `maxMembers` del plan. Si se excede, rechaza la operación con código `409 Conflict` y mensaje claro.
- Al registrar nuevos técnicos en el taller (`POST /api/v1/technicians`), el servidor verifica el conteo de técnicos versus `maxTechnicians` del plan.
- Si la suscripción de la organización está en estado `SUSPENDED` o `CANCELED`, se restringe el alta de nuevos recursos.

### D. Consola de Plataforma (`/suscripciones-saas`)

- Vista exclusiva para Superadministradores de Plataforma (`isPlatformAdmin`).
- **Pestaña Membresías de Talleres**:
  - Tabla de suscripciones con filtros por estado (`Todos`, `Activa`, `Prueba`, `Vencida`, `Suspendida`, `Cancelada`), búsqueda y filtro por plan.
  - Métricas rápidas: Total de talleres suscritos, suscripciones activas, talleres en período de prueba y suscripciones por vencer o suspendidas.
  - Botón **`[+ Asignar Membresía]`**: permite vincular o migrar directamente una membresía anual o mensual a cualquier organización existente en producción, calculando automáticamente la vigencia (ej. +365 días para ciclos anuales).
  - Diálogo modal de gestión de suscripción (`SubscriptionEditModal`): permite al administrador de plataforma modificar plan, estado, fecha de corte y notas administrativas.
- **Pestaña Planes Comerciales**:
  - Catálogo interactivo de planes con límites de miembros, técnicos y productos, tarifas mensual/anual y checklist de beneficios.
  - Botón **`[+ Nuevo Plan]`**: modal para dar de alta nuevos planes comerciales (`PlanFormModal`).
  - Botón **`[Editar Plan]`**: modal para ajustar precios, cuotas máximas, descripción y funcionalidades incluidas.

### E. Vista de Suscripción en el Taller (`/suscripcion`)

- Acceso para usuarios con rol `Dueño del taller` o `Administrador`.
- Tarjeta informativa del plan contratado con distintivo de estado (`Activo`, `Prueba`, `Suspendido`).
- Barras de progreso de uso en tiempo real:
  - **Miembros del taller**: Utilizados vs. Límite del plan.
  - **Técnicos operativos**: Registrados vs. Límite del plan.
  - **Productos en almacén**: Registrados vs. Límite del plan.
- Información de ciclo de facturación y fecha de próxima renovación.

---

## 3. Entregables

1. **Documentación:**
   - `README.md`: Resumen y requerimientos funcionales del sprint.
   - `implementation-plan.md`: Diseño técnico, esquema Prisma, contratos API y componentes UI.
   - `acceptance-and-test-plan.md`: Casos de prueba automatizados y manuales con criterios DoD.
   - `approval.md`: Acta de cierre y verificación de entrega.
2. **Backend API:**
   - Modelo Prisma `Plan` y `OrganizationSubscription` con migración SQL en `apps/api/prisma/migrations/20261108000000_add_plans_and_subscriptions/`.
   - Semillas en `prisma/seed.ts` para planes predeterminados (`STARTER`, `PRO`, `ENTERPRISE`) y suscripción inicial para organizaciones existentes.
   - Módulo `subscriptions`: repositorio, servicio, controlador, esquemas Zod y rutas en `/api/v1/subscriptions` y `/api/v1/platform/subscriptions`.
   - Validación de cuotas en servicio de miembros y técnicos.
   - Pruebas unitarias de esquemas y validaciones de cuota.
3. **Frontend Web:**
   - Tipos TypeScript en `subscriptions.types.ts`.
   - Servicios y hooks React Query en `use-subscriptions.ts`.
   - Rutas en router:
     - `/plataforma/suscripciones` (consola de plataforma).
     - `/suscripcion` (consulta para taller).
   - Componentes de gestión en plataforma y visualización de cuotas para el taller.
   - Pruebas unitarias en Vitest.
