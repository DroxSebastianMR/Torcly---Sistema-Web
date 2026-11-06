# Plan de Implementación — Sprint 26

## 1. Contexto

El sistema dispone de la base de datos de notificaciones y la lógica de emisión segura en segundo plano (`notifyUsersSafely`). Sin embargo, el frontend carece de visibilidad porque la ruta no estaba montada en el enrutador protegido, la campana no estaba integrada en el header y la navegación lateral no mostraba la burbuja ni el acceso directo.

---

## 2. Fases de Desarrollo

### Fase 1: Integración de Rutas y Menú Principal

1. **Rutas protegidas:** Montar `/notificaciones` en `apps/web/src/app/router/routes/protected.routes.tsx` bajo `PermissionRoute permission="notifications:read"`.
2. **Definición de navegación:** Añadir el elemento `notificaciones` en `apps/web/src/features/navigation/config/app-navigation.ts` con ícono `Bell`.
3. **Soporte de burbuja en Sidebar:**
   - Añadir propiedad `badge?: number | string` a `NavigationItem` en `navigation.types.ts`.
   - Modificar `SidebarNavigationItem` para renderizar una burbuja redondeada con el número cuando `badge > 0`.
   - Modificar `useAppSidebar` para consultar `useUnreadNotificationsCount` y adjuntar el conteo a la opción de notificaciones.

### Fase 2: Campana y Popover en Cabecera

1. **Componente de Popover:** Refactorizar `NotificationSummaryPopover` para garantizar soporte multiplataforma usando estado reactivo (`isOpen`, ref y cierre al hacer clic fuera o presionar Escape).
2. **Integración en `AppHeader`:** Añadir el componente de campana en el lado derecho de la cabecera antes del botón de logout (solo para usuarios del taller, excluyendo administradores de plataforma).

### Fase 3: Eventos Operativos del Taller

1. **Ampliación de tipos:** Agregar `APPOINTMENT_OVERDUE` y `PAYMENT_DUE` a `NotificationType` en `notifications.types.ts`.
2. **Iconos y etiquetas:** Añadir representación visual en `notification-card.tsx` para los nuevos tipos de avisos del taller.
3. **Robustez en Repository:** Prevenir excepciones de tipo UUID en pruebas o consultas huérfanas en `notifications.repository.ts`.

### Fase 4: Pruebas y Validación

1. Ejecutar pruebas unitarias de API y Web.
2. Ejecutar `typecheck` y `lint`.
3. Validar el flujo interactivo de visualización y marcado de lectura.
