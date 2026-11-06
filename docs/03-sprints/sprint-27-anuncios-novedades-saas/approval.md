# Acta de Aprobación — Sprint 27

- **Fecha:** 5 de noviembre de 2026
- **Sprint:** 27 — Novedades y Anuncios SaaS (Prioridad 3)
- **Rama:** `feature/announcements-news`
- **Estado:** Aprobado para integración en `develop`

---

## 1. Verificación de Criterios de Aceptación

- [x] Modelo de base de datos `Announcement` y `AnnouncementRead` implementado con enums `AnnouncementType` y `AnnouncementStatus` y migración SQL.
- [x] Endpoints de backend operativos en `/api/v1/announcements` para consulta, lectura, conteo y gestión administrativa con autorización y validación Zod.
- [x] Difusión masiva hacia el centro de notificaciones de talleres activos con salvaguarda tolerante a fallos (`broadcastToActiveUsers`).
- [x] Módulo web `/novedades` implementado para usuarios de taller con feed de novedades, filtros por categoría (Actualizaciones, Mantenimientos, Comunicados), visor de video tutorial y modal de detalle.
- [x] Módulo administrativo `/plataforma/anuncios` implementado para Superadmin de Plataforma con formulario modal de alta/edición y generador automático de release de versión (`v1.1.2`).
- [x] Soporte de burbuja numérica (badge) de novedades no leídas en el menú lateral sincronizado mediante React Query.
- [x] Paleta visual suave de Torcly aplicada con fidelidad (#E7F6EF/#329B78, #FFF0F4/#CE4779, #EAF4FD/#4385C7, #FFFBE8/#C58A24).
- [x] Pruebas unitarias de esquemas, servicio y formateadores pasando al 100%.
- [x] Typecheck limpio (`0` errores) en `@torcly/api` y `@torcly/web`.

---

## 2. Dictamen

El Sprint 27 cumple a cabalidad con todos los requerimientos funcionales, de arquitectura, de seguridad y diseño visual de Torcly. Se autoriza la integración en la rama `develop`.
