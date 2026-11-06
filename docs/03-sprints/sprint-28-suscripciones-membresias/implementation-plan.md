# Plan de Implementación — Sprint 28: Suscripciones y Membresías

## 1. Diseño de Base de Datos (Prisma)

### A. Nuevos Enums y Modelos

```prisma
enum SubscriptionStatus {
  ACTIVE
  TRIAL
  PAST_DUE
  CANCELED
  SUSPENDED

  @@map("subscription_status")
}

enum BillingCycle {
  MONTHLY
  ANNUAL

  @@map("billing_cycle")
}

model Plan {
  id              String                     @id @default(uuid()) @db.Uuid
  code            String                     @unique @db.VarChar(40)
  name            String                     @db.VarChar(120)
  description     String?                    @db.VarChar(300)
  priceMonthly    Decimal                    @default(0) @map("price_monthly") @db.Decimal(10, 2)
  priceYearly     Decimal                    @default(0) @map("price_yearly") @db.Decimal(10, 2)
  currency        String                     @default("PEN") @db.VarChar(3)
  maxMembers      Int                        @default(5) @map("max_members")
  maxTechnicians  Int                        @default(10) @map("max_technicians")
  maxProducts     Int                        @default(500) @map("max_products")
  features        Json?                      @default("[]")
  active          Boolean                    @default(true)
  isPublic        Boolean                    @default(true) @map("is_public")
  createdAt       DateTime                   @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt       DateTime                   @updatedAt @map("updated_at") @db.Timestamptz(3)
  subscriptions   OrganizationSubscription[]

  @@map("plans")
}

model OrganizationSubscription {
  id             String             @id @default(uuid()) @db.Uuid
  organizationId String             @unique @map("organization_id") @db.Uuid
  planId         String             @map("plan_id") @db.Uuid
  status         SubscriptionStatus @default(ACTIVE)
  billingCycle   BillingCycle       @default(MONTHLY) @map("billing_cycle")
  startsAt       DateTime           @default(now()) @map("starts_at") @db.Timestamptz(3)
  renewsAt       DateTime?          @map("renews_at") @db.Timestamptz(3)
  canceledAt     DateTime?          @map("canceled_at") @db.Timestamptz(3)
  notes          String?            @db.VarChar(500)
  createdAt      DateTime           @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt      DateTime           @updatedAt @map("updated_at") @db.Timestamptz(3)
  organization   Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan           Plan               @relation(fields: [planId], references: [id], onDelete: Restrict)

  @@index([status])
  @@index([planId])
  @@map("organization_subscriptions")
}
```

---

## 2. Endpoints y Arquitectura Backend (API)

### A. Rutas de Taller (`/api/v1/subscriptions`)

- `GET /api/v1/subscriptions/current`:
  - Requiere sesión activa en una organización.
  - Retorna información de la suscripción activa del taller, el plan asociado y los consumos actuales en tiempo real:
    ```json
    {
      "subscription": {
        "id": "...",
        "status": "ACTIVE",
        "billingCycle": "MONTHLY",
        "startsAt": "2026-11-01T00:00:00.000Z",
        "renewsAt": "2026-12-01T00:00:00.000Z"
      },
      "plan": {
        "id": "...",
        "code": "PRO",
        "name": "Plan Profesional",
        "maxMembers": 10,
        "maxTechnicians": 15,
        "maxProducts": 2500,
        "features": [
          "Asistente IA",
          "Múltiples sesiones de caja",
          "Analítica avanzada"
        ]
      },
      "usage": {
        "members": { "current": 3, "max": 10, "percent": 30 },
        "technicians": { "current": 4, "max": 15, "percent": 26 },
        "products": { "current": 120, "max": 2500, "percent": 4.8 }
      }
    }
    ```

### B. Rutas de Plataforma (`/api/v1/platform/subscriptions` y `/api/v1/platform/plans`)

- Requieren `isPlatformAdmin`.
- `GET /api/v1/platform/plans`: Listado de todos los planes comerciales disponibles.
- `POST /api/v1/platform/plans`: Creación de un nuevo plan comercial (código, nombre, cuotas, precios mensual y anual, beneficios).
- `PATCH /api/v1/platform/plans/:planId`: Modificación de un plan comercial existente (precios, cuotas de miembros/técnicos/productos, estado activo/público).
- `GET /api/v1/platform/subscriptions`: Listado paginado de suscripciones de todas las organizaciones, con búsqueda y filtro por estado y plan.
- `GET /api/v1/platform/subscriptions/metrics`: Métricas agregadas de plataforma (activas, trial, suspendidas, vencidas).
- `POST /api/v1/platform/subscriptions`: Asignación directa o migración de membresía (anual o mensual) a cualquier organización existente en la plataforma (`upsertSubscription`).
- `PATCH /api/v1/platform/subscriptions/:organizationId`: Actualización administrativa de la suscripción (cambiar de plan, modificar vigencia `renewsAt`, cambiar estado `status`, notas).

### C. Validación de Límites (Quota Enforcement)

- En el servicio de creación de miembros:
  - Se consulta la suscripción de la organización.
  - Si `currentMembers >= plan.maxMembers`, se lanza un error descriptivo:
    `"La organización ha alcanzado el límite máximo de miembros (X) para su plan actual."`
- En el servicio de creación de técnicos:
  - Si `currentTechnicians >= plan.maxTechnicians`, se lanza un error descriptivo:
    `"La organización ha alcanzado el límite máximo de técnicos (Y) para su plan actual."`

---

## 3. Frontend Web

### A. Navegación

- **Plataforma Torcly** (`apps/web/src/features/navigation/config/platform-navigation.ts`):
  - Nuevo ítem: `Suscripciones` (`/plataforma/suscripciones`), icono `CreditCard` o `Crown`.
- **Navegación de Taller** (`apps/web/src/features/navigation/config/app-navigation.ts`):
  - Nuevo ítem en grupo de Configuración/Administración: `Suscripción` (`/suscripcion`), visible para dueños o administradores del taller.

### B. Módulo de Suscripciones en Plataforma (`src/features/platform/pages/platform-subscriptions-page.tsx`)

- Pestaña dual: **Membresías de Talleres** y **Planes Comerciales**.
- Métricas principales en tarjetas tipo resumen.
- Tabla con filtros por estado, plan y búsqueda por taller.
- Modal de asignación de membresía (`SubscriptionAssignModal`) con cálculo automático de corte para ciclos anuales o mensuales.
- Modal de creación y edición de planes (`PlanFormModal`) con validación de cuotas operativas y tarifas.
- Modal de edición rápida para cambio de plan y ajuste de fechas (`SubscriptionEditModal`).

### C. Módulo de Suscripción en Taller (`src/features/subscriptions/pages/subscription-page.tsx`)

- Indicadores visuales de estado y próximo cobro/renovación.
- Barras de progreso de uso por cada recurso del taller.
- Desglose de beneficios incluidos en el plan activo.
