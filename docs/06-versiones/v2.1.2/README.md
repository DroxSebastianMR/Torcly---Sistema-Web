# Torcly v2.1.2 — Plataforma SaaS: Notificaciones, Anuncios Globales, Planes Comerciales y Membresías

Fecha de lanzamiento: 6 de noviembre de 2026  
Rama base: `develop`  
Estado: Integrado y verificado en `develop`

---

## 1. Resumen Ejecutivo de la Versión

La versión **v2.1.2** de **Torcly** representa un salto fundamental en la madurez de la plataforma, consolidando el ecosistema SaaS multi-inquilino (_multi-tenant_). Esta entrega integra cuatro sprints consecutivos de alta relevancia estratégica (Sprints 25, 26, 27 y 28), además de correcciones críticas de estabilidad (_hotfixes_) y refinamientos de interfaz bajo los estándares de diseño institucionales de Torcly.

Con esta versión, la plataforma dispone de:

1. Emisión y restablecimiento controlado de contraseñas temporales por taller.
2. Centro unificado de notificaciones operativas en tiempo real.
3. Consola y feed global de anuncios y comunicados para talleres.
4. Gestión comercial integral de planes SaaS, asignación directa de membresías a organizaciones y control de cuotas operativas de miembros, técnicos y catálogo.

---

## 2. Detalle de Módulos y Sprints Incluidos

### A. Sprint 25: Restablecimiento Administrativo de Credenciales (`sprint-25-admin-password-reset`)

- **Emisión Segura de Credenciales Temporales:**
  - Los administradores de plataforma pueden generar una clave de acceso temporal de un solo uso para cualquier miembro de una organización desde `/organizaciones`.
  - La clave se renderiza en un bloque contextual interactivo ubicado **inmediatamente debajo del usuario seleccionado**, sin desplazar la vista al tope del modal.
  - **Temporizador de Autodestrucción:** Cuenta regresiva visible de 60 segundos con barra de progreso; al expirar el tiempo, la clave se borra de memoria por seguridad.
  - Botón de copiado al portapapeles con confirmación visual interactiva.
- **Seguridad en Primer Acceso:**
  - El usuario que recibe la clave temporal es forzado a cambiar su contraseña de manera obligatoria al iniciar sesión.

---

### B. Sprint 26: Centro Unificado de Notificaciones del Taller (`sprint-26-notificaciones-taller`)

- **Campana de Alertas en Tiempo Real:**
  - Indicador flotante en el Header superior con badge numérico dinámico de notificaciones pendientes de lectura.
  - Popover interactivo para previsualización rápida con orden cronológico y estado de lectura.
- **Categorización Operativa:**
  - Alertas clasificadas por contexto: Citas de clientes, Órdenes de trabajo, Alertas de stock mínimo de inventario y Notificaciones de plataforma.
- **Gestión de Lectura:**
  - Acciones unitarias de marcado como leído y botón global _"Marcar todas como leídas"_, persistiendo el estado en base de datos (`PATCH /notifications`).

---

### C. Sprint 27: Sistema Global de Anuncios y Novedades SaaS (`sprint-27-anuncios-novedades-saas`)

- **Consola de Publicación Centralizada (`/anuncios`):**
  - Espacio para que el equipo de soporte y producto publique comunicados, avisos de mantenimientos programados y notas de lanzamientos de versión.
- **Editor Enriquecido con Previsualización:**
  - Soporte Markdown completo con renderizado de encabezados, listas y llamadas de atención.
  - **Control de Escala Tipográfica:** Selectores de tamaño de fuente inspirados en procesadores de texto (10px, 12px, 14px, 16px) para adaptar jerarquías visuales.
  - **Etiquetas de Versión Opcionales:** La versión asociada es requerida únicamente para comunicados de actualización, siendo opcional en avisos de mantenimiento o comunicados generales.
- **Localización al Español:**
  - Estados comerciales traducidos formalmente (`Publicado`, `Borrador`, `Archivado`) eliminando identificadores crudos en pantalla.

---

### D. Sprint 28: Planes Comerciales y Membresías SaaS (`sprint-28-suscripciones-membresias`)

- **Gestión Comercial de Planes:**
  - Creación y edición de planes comerciales con tarifas mensual y anual (`PEN`), descripción orientativa y lista de funcionalidades incluidas.
  - Cuotas operativas parametrizables del servidor: límite máximo de miembros, mecánicos/técnicos activos y artículos en catálogo de productos.
- **Asignación Directa de Membresías:**
  - Diálogo modal ampliado (`max-w-3xl`) que permite vincular un plan comercial a cualquier organización existente, definiendo ciclo (mensual/anual), estado inicial y notas comerciales.
- **Integración de DatePicker Propio de Torcly:**
  - Eliminación de selectores nativos de navegador en favor del componente custom `DatePicker`, con anclaje inteligente (`align="right"`) para evitar recortes en bordes de ventana.
- **Guardia de Desactivación con Conteo de Talleres:**
  - Botón interactivo `[Desactivar]` / `[Activar]` por plan.
  - **Bloqueo de Desactivación en Uso:** Si el plan tiene 1 o más talleres con suscripciones activas (`ACTIVE`, `TRIAL`, `PAST_DUE`, `SUSPENDED`), el sistema impide la desactivación (validado en frontend y con código `409 Conflict` en API), requiriendo migrar los talleres antes de desactivar el plan.
  - Diálogo de confirmación con `ConfirmationDialog` cuando el plan no posee talleres activos.

---

### E. Hotfixes y Refinamientos de Arquitectura

1. **Estabilidad de Hooks en Modal de Miembros:**
   - Separación de `OrganizationMembersModal` de su implementación interna para erradicar violaciones de las Reglas de Hooks de React por retornos tempranos.
2. **Redirección de Errores para Administrador Global (`RouteError`):**
   - Ajuste en el manejador global de rutas: cuando un administrador de plataforma presiona _"Volver al inicio"_ tras un error inesperado, es redirigido a `/organizaciones` (`paths.platform`) en lugar de `/dashboard`, previniendo la pantalla errónea de _"Acceso restringido"_.
3. **Limpieza y Estándar de Diálogos:**
   - Eliminación de encabezados visuales con iconos en la parte superior de los modales de plataforma (`subscription-assign`, `plan-form`, `subscription-edit`, `organization-form`, `organization-edit`, `announcement-form`), logrando un formato limpio y homogéneo.
   - Eliminación del botón redundante _"Cerrar"_ en el footer de miembros de organización, unificando la salida mediante la **X** superior.
   - Corrección de viñetas en la lista de beneficios para asegurar geometría circular perfecta (`6px × 6px`, `aspect-square`).
   - Ocultamiento de barra gris nativa de scroll en áreas de texto (`no-scrollbar`).

---

## 3. Matriz de Componentes y Modelos Afectados

| Componente / Módulo               | Propósito y Ajustes en v2.1.2                                                                                                 |
| :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `Prisma Schema`                   | Modelos `Subscription`, `Plan`, `Announcement`, `AnnouncementRead`, `Notification`. Relaciones y restricciones de integridad. |
| `subscriptions.service.ts`        | Reglas de negocio para asignación, actualización, conteo de talleres activos y bloqueo de desactivación.                      |
| `announcements.service.ts`        | Listado, creación, actualización y control de versionado global (`CURRENT_SAAS_VERSION = '2.1.2'`).                           |
| `subscription-assign-modal.tsx`   | Asignación de planes con modal ancho y `DatePicker` propio de Torcly.                                                         |
| `platform-subscriptions-page.tsx` | Métricas SaaS, tabla de membresías, tarjetas de planes con toggle activar/desactivar y avisos de bloqueo.                     |
| `app-header.tsx`                  | Campana de notificaciones operativas en vivo y perfil multitenant.                                                            |
| `app-sidebar-view.tsx`            | Footer actualizado a la versión oficial `v2.1.2`.                                                                             |

---

## 4. Verificación de Calidad y Pruebas

- **TypeScript (`typecheck`):** 0 errores (`pnpm typecheck` aprobado en `@torcly/api` y `@torcly/web`).
- **Formateo y Estilo:** 100% verificado con Prettier.
- **Suites de Pruebas Unitarias y de Integración (`vitest`):**
  - **API:** 25/25 pruebas aprobadas (`subscriptions.service.test.ts`, `subscriptions.schemas.test.ts`, `announcements.*`).
  - **Web:** 474/474 pruebas aprobadas en toda la aplicación cliente.
- **Aislamiento Multi-inquilino:** Probado y validado en PostgreSQL con esquemas de organización y credenciales independientes.

---

## 5. Control de Versiones

- **Versión Anterior:** `v1.1.2`
- **Versión Actual:** `v2.1.2`
- **Rama de Integración:** `develop`
