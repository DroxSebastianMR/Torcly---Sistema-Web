# Plan de Implementación — Sprint 24

## 1. Contexto

Tras la publicación de la multitenencia funcional (v1.1.1), se identificó la necesidad de jerarquizar los perfiles operativos del taller:

1. El negocio cuenta con un propietario (**Dueño del taller**) y una persona encargada de la operativa diaria (**Administrador del taller**).
2. El Administrador del taller no debe poder crear cuentas ni manipular permisos de usuarios.
3. El encabezado superior debe exhibir con claridad la organización activa, el rol de la sesión y el estado de conectividad.

---

## 2. Fases de Implementación

### Fase 1: Base de datos y Migraciones

1. Crear la migración `20261105000000_add_workshop_manager_role/migration.sql`.
2. Insertar el rol `workshop_manager` con nombre _"Administrador del taller"_.
3. Asignar los permisos operativos excluyendo explícitamente `users:read` y `users:write`.
4. Extender `apps/api/prisma/seed.ts` para replicar esta configuración en nuevas inicializaciones.

### Fase 2: Backend y Sesión de Usuario

1. Actualizar `AuthUser` en `auth.types.ts` incorporando `role?: { code: string; name: string }`.
2. En `toAuthUser` (`auth.service.ts`), resolver el rol activo primario de la membresía y adjuntarlo al payload de autenticación.

### Fase 3: Frontend y Navegación

1. Actualizar la interfaz de usuario `User` en `features/auth/types/auth.types.ts` con el campo `role`.
2. Exponer `userName`, `userEmail`, `userRole` y `organization` en `useAppHeader`.
3. Rediseñar `AppHeader`:
   - Lado izquierdo: Nombre de organización (`font-brand`, `text-primary`, 17–19px) y rol debajo (`11px`, `text-muted-foreground`).
   - Lado derecho: Nombre de persona (`10–11px`, `text-muted-foreground`), correo en negro seminegrita (`11–12px`) y estado en línea con punto verde pulsante.
4. Ajustar el footer del sidebar a `v1.1.2`.

### Fase 4: Operaciones y Configuración de Datos

1. Aplicar la migración en la base de datos de producción mediante `deploy-production-migrations.ts`.
2. Asignar a Ysabel Quinteros el rol `workshop_manager` y confirmar a Jhon Medina como `administrator`.
3. Validar la ausencia de cuentas residuales en la organización "Grupo Mecatronic".
