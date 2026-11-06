# Sprint 25 — Restablecimiento Asistido de Contraseñas y Soporte

## Resultado esperado

Habilitar un mecanismo seguro, trazable e inmediato para restablecer credenciales de usuarios sin depender de un dominio configurado ni de un servidor de correo transaccional (SMTP). Permitir que el **Dueño del taller** (en `/usuarios`) y el **Administrador de plataforma** (en `/plataforma`) emitan contraseñas temporales que obligan al usuario a definir una clave personal definitiva en su próximo inicio de sesión.

---

## Entregables

1. **Esquema de base de datos:**
   - Columna `must_change_password` (booleano por defecto `false`) en la tabla `users`.
   - Migración versionada `20261106000000_add_must_change_password`.
2. **Backend (API y Seguridad):**
   - Endpoint `POST /api/v1/users/:id/reset-password` protegido por `users:write` con validación de aislamiento de tenant.
   - Endpoint `POST /api/v1/platform/organizations/:orgId/members/:userId/reset-password` protegido por `isPlatformAdmin`.
   - Generador de contraseñas temporales de alta entropía (ej. `Torcly-XXXX-XXXX`).
   - Registro de auditoría `PASSWORD_RESET_BY_ADMIN` e invalidación forzada de sesiones activas del usuario objetivo.
   - Transporte del estado `mustChangePassword` en el payload de sesión `/auth/session`.
   - Actualización del endpoint de cambio de clave en perfil (`/profile/change-password`) para limpiar la bandera `mustChangePassword`.
3. **Frontend (UI y Experiencia de Usuario):**
   - Diálogo modal para **Restablecer Contraseña** en `/usuarios` con botón de un clic para copiar la clave temporal y enviarla por WhatsApp o canal seguro.
   - Botón de restablecimiento de clave en la gestión de miembros de `/plataforma`.
   - Modal bloqueante de cambio obligatorio de contraseña si `mustChangePassword === true` al iniciar sesión.
   - Mensaje informativo refinado en el enlace "¿Olvidaste tu contraseña?" del login.

---

## Fuera de alcance

- Envío de correos por SMTP masivo (se reservará para cuando se disponga de dominio institucional con registros SPF/DKIM).
- Preguntas de seguridad personales.
- Integración con pasarelas de SMS.

---

## Estado

**En implementación sobre la rama `feature/admin-password-reset`.**
