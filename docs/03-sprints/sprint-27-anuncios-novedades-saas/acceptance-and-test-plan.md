# Criterios de Aceptación y Plan de Pruebas — Sprint 27

## 1. Criterios de Aceptación

### CA-01: Publicación de Anuncios y Versiones por Superadmin

- El Administrador de Plataforma puede acceder a `/plataforma/anuncios`.
- Puede registrar comunicados, mantenimientos y versiones (`v1.1.2`, etc.) con título, resumen, contenido en markdown, video opcional y rango de horas.
- Dispone de un botón "Generar Anuncio de Versión Actual" que autocompleta los datos de la versión activa.
- Puede activar la opción "Notificar a todos los usuarios", la cual crea una notificación en la campana de todos los usuarios de talleres activos.

### CA-02: Feed de Novedades para Usuarios de Taller

- Los usuarios de taller visualizan el acceso `Novedades` en el grupo `General` del menú lateral.
- El menú lateral muestra una burbuja numérica (`badge`) con el número de anuncios no leídos.
- La página `/novedades` lista las publicaciones ordenadas por fecha con filtros (`Todas`, `Versiones`, `Mantenimientos`, `Comunicados`).
- Las tarjetas aplican la paleta suave oficial de Torcly (menta, cielo, lavanda, rosa suave, amarillo crema).
- Al hacer clic en una tarjeta, se abre el modal de detalle con el contenido completo, el video tutorial si existe, y se marca automáticamente como leído.
- Opción "Marcar todas como leídas" disponible en la cabecera.

### CA-03: Seguridad y Permisos

- Solo usuarios con `isPlatformAdmin: true` pueden crear, editar, eliminar o publicar anuncios.
- Cualquier usuario autenticado de taller con sesión activa puede consultar el feed público y gestionar su propio estado de lectura.

---

## 2. Plan de Pruebas

### Pruebas Unitarias Backend

- `announcements.schemas.test.ts`:
  - Validación de campos requeridos (título, resumen, tipo).
  - Rechazo de URLs de video no válidas.
  - Validación de coherencia de fechas en ventanas de mantenimiento (`endsAt > startsAt`).
- `announcements.service.test.ts`:
  - Listado de anuncios públicos con estado de lectura por usuario.
  - Creación de anuncio con difusión y creación de notificaciones en organizaciones.
  - Conteo de no leídos por usuario.

### Pruebas Frontend

- `announcements-feed-page.test.tsx`:
  - Renderizado del feed con tarjetas y categorías.
  - Apertura de modal de detalle y marcado de lectura.
  - Filtro por pestañas.
- `announcements-admin-page.test.tsx`:
  - Formulario de creación de anuncio y publicación.
