# Plan de Aceptación y Pruebas — Sprint 25

## 1. Criterios de Aceptación

### Criterio 1: Restablecimiento desde el Taller (`/usuarios`)

- **Dado** que un Dueño de taller (`users:write`) selecciona a un miembro de su equipo.
- **Cuando** hace clic en _"Restablecer contraseña"_ y confirma la acción.
- **Entonces**:
  - La API genera una contraseña temporal segura.
  - Se resetean los intentos fallidos de login (`failedLoginAttempts = 0`) y se remueve cualquier bloqueo temporal (`lockedUntil = null`).
  - Se revocan todas las sesiones activas previas del usuario objetivo.
  - Se activa `must_change_password = true`.
  - La interfaz muestra la contraseña en un campo de solo lectura con un botón _"Copiar contraseña temporal"_.
  - Se registra el evento en `audit_logs` con la IP, fecha y actor.

### Criterio 2: Restablecimiento desde Plataforma (`/plataforma`)

- **Dado** que el Administrador de Plataforma (`isPlatformAdmin = true`) accede a los miembros de una organización.
- **Cuando** solicita el restablecimiento de contraseña de cualquier miembro (incluyendo dueños de taller).
- **Entonces** se emite la contraseña temporal segura y se activa la obligación de cambio en el siguiente acceso.

### Criterio 3: Aislamiento entre Talleres

- **Dado** un actor del Taller A con permisos `users:write`.
- **Cuando** intenta enviar una petición a `/api/v1/users/:id/reset-password` pasando el UUID de un usuario del Taller B.
- **Entonces** la API retorna `404 Not Found` (o `403 Forbidden`) y no modifica ninguna credencial.

### Criterio 4: Flujo de Cambio Obligatorio en el Primer Login

- **Dado** un usuario cuya contraseña fue restablecida administrativamente (`mustChangePassword: true`).
- **Cuando** inicia sesión exitosamente con su clave temporal.
- **Entonces**:
  - La aplicación presenta un diálogo modal obligatorio para definir su nueva contraseña personal.
  - No se permite navegar ni operar hasta completar el cambio de clave.
  - Al guardar la nueva clave, `must_change_password` pasa a `false` y el modal desaparece.

---

## 2. Matriz de Pruebas

| ID            | Escenario                              | Tipo       | Resultado esperado                               |
| :------------ | :------------------------------------- | :--------- | :----------------------------------------------- |
| **TC-S25-01** | Migración `must_change_password`       | DB         | Columna agregada con default `false`             |
| **TC-S25-02** | Generación de clave temporal por Dueño | API        | Devuelve clave aleatoria y marca usuario         |
| **TC-S25-03** | Protección multi-tenant                | API        | Deniega reset de usuarios de otro taller         |
| **TC-S25-04** | Invalidación de sesiones               | Auth       | Sesiones anteriores del usuario quedan inactivas |
| **TC-S25-05** | Copia de clave temporal en UI          | Frontend   | Clipboard recibe la clave formateada             |
| **TC-S25-06** | Modal de cambio forzado al login       | Frontend   | Bloquea navegación hasta actualizar contraseña   |
| **TC-S25-07** | Cambio exitoso de contraseña           | End-to-End | Limpia `mustChangePassword` y permite operar     |
