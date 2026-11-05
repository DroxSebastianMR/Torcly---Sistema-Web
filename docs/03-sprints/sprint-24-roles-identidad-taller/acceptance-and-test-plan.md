# Plan de Aceptación y Pruebas — Sprint 24

## 1. Criterios de Aceptación

### Criterio 1: Creación y matriz de permisos del nuevo rol

- **Dado** que se despliega la versión v1.1.2.
- **Cuando** se consultan los roles activos en la base de datos o mediante el endpoint `/api/v1/users/roles`.
- **Entonces** existen dos roles activos para el taller:
  1. `Dueño del taller` con 30 permisos (incluyendo `users:read` y `users:write`).
  2. `Administrador del taller` con 28 permisos (todos los operativos, sin `users:read` ni `users:write`).

### Criterio 2: Aislamiento del módulo de Usuarios y permisos

- **Dado** un usuario autenticado con el rol `Administrador del taller`.
- **Cuando** carga la interfaz de Torcly.
- **Entonces**:
  - El módulo _"Usuarios y permisos"_ no aparece en la barra de navegación lateral.
  - Si intenta navegar directamente a la URL `/usuarios`, el guardia de permisos lo bloquea o redirige.
  - Si realiza una petición a `/api/v1/users`, la API responde con código `403 Forbidden`.

### Criterio 3: Facultades del Dueño del taller

- **Dado** un usuario autenticado con el rol `Dueño del taller`.
- **Cuando** ingresa a _"Usuarios y permisos"_ y abre el formulario de registrar o editar usuario.
- **Entonces** el selector de rol presenta ambas opciones (`Dueño del taller` y `Administrador del taller`) y permite la creación/asignación correcta.

### Criterio 4: Header de Identidad SaaS

- **Dado** cualquier usuario autenticado en su taller.
- **Cuando** visualiza el encabezado superior.
- **Entonces**:
  - A la izquierda se observa el nombre del taller en tipografía `Raleway` verde corporativo, y debajo su rol en gris.
  - A la derecha se observa el nombre del usuario en gris, y debajo su correo en negro seminegrita junto al punto verde con la leyenda _"En línea"_ en gris.

---

## 2. Matriz de Pruebas Ejecutadas

| ID            | Escenario                                 | Tipo           | Resultado esperado                                  | Estado      |
| :------------ | :---------------------------------------- | :------------- | :-------------------------------------------------- | :---------- |
| **TC-S24-01** | Aplicación de migración de roles          | Base de datos  | Crea `workshop_manager` y 28 asignaciones           | Aprobado ✅ |
| **TC-S24-02** | Consulta de roles en endpoint             | Backend / API  | Retorna `administrator` y `workshop_manager`        | Aprobado ✅ |
| **TC-S24-03** | Sesión con transporte de rol              | Backend / Auth | `session.user.role` contiene código y nombre formal | Aprobado ✅ |
| **TC-S24-04** | Ocultamiento de menú para admin de taller | Frontend / UI  | `filterNavigation` excluye _"Usuarios y permisos"_  | Aprobado ✅ |
| **TC-S24-05** | Renderizado tipográfico del Header        | Frontend / UI  | Fuente de marca, contrastes verde/negro/gris        | Aprobado ✅ |
| **TC-S24-06** | Typecheck y Linting general               | CI / Calidad   | 0 errores en API y Web                              | Aprobado ✅ |
