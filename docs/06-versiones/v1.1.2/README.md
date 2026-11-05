# Torcly v1.1.2 — Roles de Taller y Refinamiento de Identidad SaaS

Fecha de lanzamiento: 5 de noviembre de 2026  
Rama base: `develop`  
Estado: Integrado y verificado en `develop`

---

## 1. Resumen Ejecutivo de la Versión

La versión **v1.1.2** introduce la primera diferenciación formal de roles jerárquicos dentro del taller automotriz y culmina el rediseño visual del encabezado superior (**Header**) para proporcionar identidad clara al tenant y al usuario activo en una arquitectura multi-inquilino (SaaS).

---

## 2. Novedades y Cambios Implementados

### A. Jerarquía de Roles de Taller (RBAC Operativo)

Se implementa una separación estricta de responsabilidades entre el propietario del negocio y la administración operativa:

- **Dueño del taller (`code: administrator`):**
  - Conserva las **30 facultades operativas** del sistema.
  - **Exclusividad de administración de personal:** Es el **único rol** con los permisos `users:read` y `users:write`.
  - Acceso total a visualizar, crear, suspender y asignar roles a los miembros del taller desde el módulo _"Usuarios y permisos"_.
- **Administrador del taller (`code: workshop_manager`):**
  - Nuevo rol del sistema con **28 facultades operativas** (clientes, vehículos, servicios, citas, órdenes de trabajo, inventario, ventas, cobros/caja, compras, proveedores y reportes).
  - **Restricción de seguridad:** No posee `users:read` ni `users:write`. El módulo _"Usuarios y permisos"_ desaparece automáticamente del menú lateral y cualquier intento de acceso por API retorna `403 Forbidden`.
- **Migración de base de datos:**
  - Se añadió la migración versionada `20261105000000_add_workshop_manager_role`, que crea el rol y vincula sus 28 permisos de forma declarativa e idempotente.
  - Se actualizó la semilla (`seed.ts`) para incluir ambos roles en cualquier instalación nueva.
- **Sesión y Transporte:**
  - La API ahora resuelve y transporta el rol activo en el objeto de autenticación (`role: { code, name }`), permitiendo que el cliente renderice el nombre formal del rol en tiempo real.

---

### B. Rediseño del Header Superior (Identidad Multi-tenant)

Se reconstruyó el encabezado de navegación para reflejar el contexto del taller y la sesión activa con alto contraste y equilibrio visual:

- **Lado izquierdo (Identidad del Negocio):**
  - **Nombre del taller:** Renderizado con la tipografía de marca (`Raleway / GTI Grotesque`), en negrita (`font-bold`) y en verde corporativo Torcly (`text-primary`, `#17634c`), con escala equilibrada (`17px` móvil / `19px` escritorio).
  - **Rol del usuario:** Posicionado inmediatamente debajo del nombre del taller en tipografía `Manrope` (`11px`), color gris tenue (`text-muted-foreground`), identificando si la sesión corresponde al _Dueño del taller_ o al _Administrador del taller_.
- **Lado derecho (Usuario y Conectividad):**
  - **Nombre de la persona:** Arriba en tipografía `Manrope` (`10-11px`) en color gris claro.
  - **Correo electrónico:** Abajo en tipografía `Manrope` seminegrita (`font-semibold`, `11-12px`) en color oscuro de alto contraste (`text-foreground`).
  - **Indicador "En línea":** Diseño limpio sin fondo, con punto verde pulsante (`bg-emerald-500 animate-pulse`) y etiqueta _"En línea"_ en gris suave seminegrita (`text-[9-10px] font-semibold text-muted-foreground`).
  - **Acceso de salida:** Botón estilizado para cierre seguro de sesión.

---

## 3. Matriz de Permisos Comparativa

| Módulo / Capacidad                 | Dueño del taller (`administrator`) | Administrador del taller (`workshop_manager`) | Administrador de plataforma (`isPlatformAdmin`) |
| :--------------------------------- | :--------------------------------: | :-------------------------------------------: | :---------------------------------------------: |
| Dashboard Operativo                |                 ✅                 |                      ✅                       |                       ❌                        |
| Clientes y Vehículos               |                 ✅                 |                      ✅                       |                       ❌                        |
| Citas y Órdenes de taller          |                 ✅                 |                      ✅                       |                       ❌                        |
| Catálogo de Productos y Servicios  |                 ✅                 |                      ✅                       |                       ❌                        |
| Inventario y Movimientos           |                 ✅                 |                      ✅                       |                       ❌                        |
| Ventas, Pagos y Caja               |                 ✅                 |                      ✅                       |                       ❌                        |
| Compras y Reabastecimiento         |                 ✅                 |                      ✅                       |                       ❌                        |
| Reportes del taller                |                 ✅                 |                      ✅                       |                       ❌                        |
| **Usuarios y permisos del taller** |         ✅ (**Exclusivo**)         |              ❌ (**Bloqueado**)               |                       ❌                        |
| **Consola global `/plataforma`**   |                 ❌                 |                      ❌                       |               ✅ (**Exclusivo**)                |

---

## 4. Verificación de Calidad

- **TypeScript (`typecheck`):** 0 errores en `@torcly/api` y `@torcly/web`.
- **ESLint (`lint`):** 0 advertencias, 0 errores.
- **Pruebas automáticas (`vitest`):** 100% de suites en verde.
- **Aislamiento Multi-tenant:** Validado en entorno PostgreSQL real con políticas RLS y pertenencia de membresía.

---

## 5. Archivos Afectados

- `apps/api/prisma/migrations/20261105000000_add_workshop_manager_role/migration.sql`
- `apps/api/prisma/seed.ts`
- `apps/api/scripts/assign-workshop-manager.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.types.ts`
- `apps/web/src/features/auth/types/auth.types.ts`
- `apps/web/src/features/navigation/components/app-header.tsx`
- `apps/web/src/features/navigation/hooks/use-app-header.ts`
- `apps/web/src/features/navigation/hooks/use-app-sidebar.ts`
- `apps/web/src/features/navigation/components/app-sidebar-view.tsx`
- `package.json`, `apps/api/package.json`, `apps/web/package.json`
