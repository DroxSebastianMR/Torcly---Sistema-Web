# Plan de Implementación — Sprint 27

## 1. Arquitectura de Datos (Prisma)

### Modelos a incorporar en `schema.prisma`:

```prisma
enum AnnouncementType {
  UPDATE
  MAINTENANCE
  COMMUNICATION
}

enum AnnouncementStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Announcement {
  id          String             @id @default(uuid()) @db.Uuid
  title       String             @db.VarChar(200)
  summary     String             @db.VarChar(500)
  content     String             @db.Text
  type        AnnouncementType   @default(UPDATE)
  status      AnnouncementStatus @default(PUBLISHED)
  versionTag  String?            @map("version_tag") @db.VarChar(50)
  videoUrl    String?            @map("video_url") @db.VarChar(500)
  startsAt    DateTime?          @map("starts_at") @db.Timestamptz(3)
  endsAt      DateTime?          @map("ends_at") @db.Timestamptz(3)
  publishedAt DateTime           @default(now()) @map("published_at") @db.Timestamptz(3)
  createdBy   String             @map("created_by") @db.VarChar(120)
  createdAt   DateTime           @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime           @updatedAt @map("updated_at") @db.Timestamptz(3)

  reads       AnnouncementRead[]

  @@index([status, publishedAt])
  @@index([type, status])
  @@map("announcements")
}

model AnnouncementRead {
  id             String       @id @default(uuid()) @db.Uuid
  announcementId String       @map("announcement_id") @db.Uuid
  userId         String       @map("user_id") @db.Uuid
  readAt         DateTime     @default(now()) @map("read_at") @db.Timestamptz(3)

  announcement   Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([announcementId, userId])
  @@index([userId])
  @@map("announcement_reads")
}
```

---

## 2. API Backend (`apps/api/src/modules/announcements/`)

- `announcements.types.ts`: DTOs, filtros, enumeraciones y respuestas de conteo.
- `announcements.schemas.ts`: Esquemas Zod para query de listado, creación, actualización y marcado de lectura.
- `announcements.repository.ts`: Operaciones Prisma para listar con estado `isRead` por usuario, conteo de no leídos, CRUD para superadmin y broadcast a usuarios.
- `announcements.service.ts`: Lógica de negocio, control de permisos (Plataforma vs Taller) y emisión de notificaciones de sistema vinculadas a la campana.
- `announcements.controller.ts`: Controladores HTTP para Express 5.
- `announcements.routes.ts`: Enrutamiento montado en `/api/v1/announcements`.

---

## 3. Frontend Web (`apps/web/src/features/announcements/`)

- `types/announcements.types.ts`: Interfaces TypeScript compartidas.
- `services/announcements.service.ts`: Cliente Axios con endpoints `/announcements`.
- `hooks/use-announcements.ts`: Consultas y mutaciones con invalidación de caché.
- `components/`:
  - `announcement-card.tsx`: Tarjeta con paleta suave (menta, cielo, lavanda, rosa), versión tag y botón de ver detalle.
  - `announcement-detail-modal.tsx`: Modal con guía completa, changelog y reproductor de video.
  - `announcement-admin-form-modal.tsx`: Modal de creación y edición para el Administrador de Plataforma.
- `pages/`:
  - `announcements-feed-page.tsx`: Vista para usuarios de taller (`/novedades`).
  - `announcements-admin-page.tsx`: Vista administrativa en consola (`/plataforma/anuncios`).
- `navigation/`:
  - Registro de ítem `Novedades` en `appNavigation` con badge numérico.
  - Registro de `Anuncios` en `platformNavigation`.
