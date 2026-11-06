# Sprint 27 — Novedades y Anuncios SaaS (Prioridad 3)

## 1. Contexto y Objetivos

Torcly opera como un sistema SaaS multitenant donde el equipo de plataforma publica nuevas versiones, mejoras en módulos, guías de usuario y mantenimientos planificados. Hasta ahora, los usuarios de los talleres no contaban con un canal directo dentro del sistema para enterarse de las actualizaciones de versión (como el lanzamiento de la `v1.1.2`), videos tutoriales, nuevas funcionalidades ni avisos preventivos de mantenimiento.

El objetivo del **Sprint 27** es implementar el módulo integral de **Novedades y Anuncios SaaS**, tanto para usuarios de taller (consumo, lectura y aprendizaje de nuevas funcionalidades) como para el Administrador de Plataforma (redacción, publicación, programación de mantenimientos y difusión masiva hacia el centro de notificaciones).

---

## 2. Alcance Funcional

### A. Gestión de Anuncios (Superadmin / Plataforma)

- Panel de control en `/plataforma/anuncios`.
- Creación, edición, archivo y publicación de anuncios categorizados:
  - `UPDATE`: Actualización / Nueva versión (con versión semántica ej. `v1.1.2`, changelog y guía de uso).
  - `MAINTENANCE`: Mantenimiento programado (con ventana de horario ej. "12:00 a.m. a 06:00 a.m." y advertencia de caída).
  - `COMMUNICATION`: Comunicado general, noticias o tips operativos.
- Soporte para videos demostrativos y tutoriales (URLs de YouTube, Vimeo o Loom).
- Opción de difusión masiva: genera automáticamente notificaciones en la campana de los usuarios de talleres activos.
- Generador automático de anuncio de versión basado en la versión activa del SaaS (`v1.1.2`).

### B. Feed de Novedades (Usuarios de Taller)

- Módulo accesible en `/novedades` en el grupo `General` del sidebar.
- Contador de novedades no vistas (`badge`) en el ítem de navegación del sidebar.
- Pestañas de filtrado: `Todas`, `Versiones`, `Mantenimientos`, `Comunicados`.
- Visualización de tarjetas con la paleta suave y acentos definidos en Torcly:
  - Verde menta (`#E7F6EF` / `#329B78`) para actualizaciones de versión.
  - Azul cielo (`#EAF4FD` / `#4385C7`) para comunicados.
  - Rosa suave (`#FFF0F4` / `#CE4779`) para avisos de mantenimiento.
  - Amarillo crema (`#FFFBE8` / `#C58A24`) para anuncios informativos.
- Vista de detalle con reproductor de video embebido, changelog y guías operativas.
- Botón "Marcar todas como leídas" y tracking individual por usuario.

---

## 3. Entregables

1. **Documentación:**
   - `README.md`: Resumen y especificaciones.
   - `implementation-plan.md`: Arquitectura, endpoints y componentes.
   - `acceptance-and-test-plan.md`: Casos de prueba y criterios DoD.
   - `approval.md`: Acta de verificación y cierre.
2. **Backend API:**
   - Modelo Prisma `Announcement` y `AnnouncementRead` con migración SQL.
   - Módulo `announcements`: repositorio, servicio, controlador, esquemas Zod y rutas en `/api/v1/announcements`.
   - Integración con el servicio de notificaciones para broadcast a organizaciones activas.
   - Pruebas unitarias de esquemas y servicio.
3. **Frontend Web:**
   - Rutas en router: `/novedades` (usuarios protegidos) y `/plataforma/anuncios` (superadmin plataforma).
   - Servicio API y hooks React Query (`useAnnouncements`, `useUnreadAnnouncementsCount`, `useAnnouncementMutations`).
   - Componentes del feed de novedades y vista de detalle con video.
   - Modal administrativo de creación y publicación de anuncios.
   - Conexión de badge numérico en sidebar de usuarios.
