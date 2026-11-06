# Plan de Implementación — Sprint 25

## 1. Contexto y Justificación

Al operar en fase SaaS inicial sin un servidor de correo transaccional (SMTP) ni dominio configurado con registros DNS, el enlace tradicional de recuperación por correo resulta inviable. La alternativa más segura, recomendada y utilizada en sistemas B2B es el **restablecimiento asistido por el administrador**, donde un rol de soporte o dueño genera una clave temporal de un solo uso y el sistema fuerza su actualización al ingresar.

---

## 2. Fases de Desarrollo

### Fase 1: Base de Datos y Modelo Prisma

1. Modificar `apps/api/prisma/schema.prisma` añadiendo `mustChangePassword Boolean @default(false) @map("must_change_password")` en el modelo `User`.
2. Crear y desplegar la migración `20261106000000_add_must_change_password/migration.sql`.
3. Ejecutar `pnpm db:generate`.

### Fase 2: Backend (Módulos Auth, Users y Platform)

1. **Utilidad de contraseña temporal:** Función `generateTemporaryPassword()` que crea contraseñas con el formato `Torcly-[4 dígitos]-[4 letras]!` con alta entropía.
2. **Servicio de usuarios:** Método `resetPassword(targetUserId, actorId, organizationId)` en `users.service.ts`:
   - Valida pertenencia a la organización (o plataforma).
   - Genera hash con salt.
   - Actualiza usuario: clave, `mustChangePassword = true`, `failedLoginAttempts = 0`, `lockedUntil = null`.
   - Revoca sesiones activas en `auth_sessions`.
   - Registra auditoría `PASSWORD_RESET_BY_ADMIN`.
   - Retorna la contraseña en texto plano para que el solicitante la copie.
3. **Controlador y Rutas:**
   - `POST /api/v1/users/:id/reset-password` en `users.routes.ts`.
   - `POST /api/v1/platform/organizations/:orgId/members/:userId/reset-password` en `platform.routes.ts`.
4. **Sesión y Perfil:**
   - Exponer `mustChangePassword` en `AuthUser` y `toAuthUser`.
   - Al cambiar la clave desde `/api/v1/profile/change-password`, resetear `mustChangePassword = false`.

### Fase 3: Frontend

1. **Modal de emisión de clave temporal:** Componente `UserPasswordResetModal` en `features/users/components/` con botón de copia rápida al portapapeles.
2. **Integración en `/usuarios`:** Botón _"Restablecer contraseña"_ en la tabla de usuarios.
3. **Integración en `/plataforma`:** Botón _"Restablecer clave"_ en el modal de miembros de organización.
4. **Guardia de cambio obligatorio:** Componente `ForcePasswordChangeModal` en el layout principal si `user.mustChangePassword === true`.

### Fase 4: Pruebas y Control de Calidad

1. Pruebas unitarias de esquemas y endpoints.
2. `typecheck` y `lint`.
3. Ejecución de migración en la base de datos de producción.
