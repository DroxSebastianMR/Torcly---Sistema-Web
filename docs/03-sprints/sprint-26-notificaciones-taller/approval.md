# Acta de Aprobación — Sprint 26

- **Fecha:** 5 de noviembre de 2026
- **Sprint:** 26 — Notificaciones Operativas de Taller (Prioridad 2)
- **Rama:** `feature/workshop-notifications`
- **Estado:** Aprobado para integración en `develop`

---

## 1. Verificación de Criterios de Aceptación y Mejoras Visuales

- [x] **Separador visual en cabecera:** Se integró un separador vertical `<div className="h-7 w-px bg-border" />` a la izquierda de la campana en `AppHeader`, equilibrando la división visual entre los datos de usuario y las acciones rápidas.
- [x] **Popover desplegable con scroll y categorías (según referencias adjuntas):**
  - Despliegue con selector por pestañas (`Todas`, `Taller`, `Citas`, `Inventario`, `Caja`).
  - Capacidad de scroll fluido (`max-h-[380px] overflow-y-auto`) con barra de desplazamiento gris oculta (`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`) para un diseño limpio e interactivo.
  - Colores encendidos en pasteles luminosos según referencia gráfica: mint/verde (`#E6F7ED` / `#059669`) para órdenes de taller e inventario, fuchsia/magenta (`#FDF2F8` / `#C026D3`) para cobros de caja, electric blue (`#EFF6FF` / `#2563EB`) para citas, warm amber (`#FEFCE8` / `#D97706`) para stock y rose (`#FEF2F2` / `#E11D48`) para vencimientos.
  - Acción rápida "Marcar todas como leídas" tanto en la cabecera como en el pie del desplegable.
  - Enlace al módulo completo "Ver todas".
- [x] **Rediseño y estructura completa de la página de Notificaciones (`/notificaciones`):**
  - Encabezado formal siguiendo la estructura institucional de Torcly (como en el módulo de Reportes):
    - Indicador superior (`kicker`): `Centro de notificaciones` en `text-xs font-semibold uppercase tracking-[0.18em] text-primary`.
    - Título principal: `text-3xl font-bold tracking-tight text-brand-forest sm:text-[2rem]` con badge de avisos nuevos.
    - Descripción: `text-sm leading-6 text-muted-foreground max-w-2xl`.
  - Expansión a ancho completo (`w-full`) y alturas armonizadas con el dashboard y módulos operativos.
  - Eliminación de tarjetas anidadas: sustituido por un contenedor unificado de bordes redondeados y filas con divisores suaves (`divide-y divide-border/60`).
  - Selector rápido de período temporal en pills en la cabecera (`Todo`, `7d`, `30d`, `90d`).
  - Badges de categoría encendidos y sin bordes toscos, junto con timestamps relativos legibles.
  - Paginación estándar de 10 elementos por página (`pageSize: 10`) sincronizada entre el backend y frontend.
- [x] **Backend enriquecido:**
  - `notificationQuerySchema` ampliado con `category`, `days` y `pageSize: 10` por defecto.
  - Filtrado en `notificationsRepository.buildWhere` por mapeo de categorías y filtro por rango de fechas `days`.
- [x] **Pruebas y calidad de código:**
  - 439 pruebas de API pasadas y 430 pruebas de Web pasadas (0 fallos).
  - Typecheck 100% en verde en `@torcly/api` y `@torcly/web`.
  - Formato Prettier aplicado en todos los archivos modificados.

---

## 2. Dictamen

**Aprobado**: El módulo y desplegable de notificaciones de taller quedan modernizados y alineados fielmente con las referencias visuales compartidas, brindando una experiencia rápida, filtrable y scrolleable para todas las alertas operativas del SaaS.
