# Sprint 24 — Roles Operativos de Taller y Refinamiento de Identidad

## Resultado esperado

Establecer la primera jerarquía de roles operativos en el taller distinguiendo al **Dueño del taller** (propietario con control de usuarios) del **Administrador del taller** (gestor operativo sin acceso a usuarios), y culminar el rediseño del encabezado superior con la identidad visual corporativa de Torcly.

---

## Entregables

1. **Nuevo rol de sistema:** Rol `Administrador del taller` (`workshop_manager`) con 28 facultades operativas y exclusión explícita de `users:read` y `users:write`.
2. **Restricción de gestión de personal:** El rol `Dueño del taller` (`administrator`) queda como el único perfil facultado para acceder al módulo _"Usuarios y permisos"_ y crear/editar colaboradores.
3. **Migración de base de datos:** Migración `20261105000000_add_workshop_manager_role` aplicada y declarada en `prisma/migrations`.
4. **Actualización de semillas:** `prisma/seed.ts` aprovisiona ambos roles de forma idempotente en instalaciones nuevas.
5. **Sesión enriquecida:** La API transporta `role: { code, name }` en la sesión autenticada para consumo del frontend.
6. **Header corporativo:**
   - Nombre de la organización en tipografía `Raleway` (`font-brand`), verde de marca (`#17634c`), tamaño equilibrado.
   - Rol del usuario en gris suave inmediatamente debajo del taller.
   - Nombre del usuario en gris en el cuadrante superior derecho.
   - Correo electrónico en negro seminegrita en el cuadrante inferior derecho.
   - Indicador _"En línea"_ con punto verde pulsante y texto gris sin fondo envolvente.
7. **Flujo de ramas Gitflow:** Inicialización de `develop` y desarrollo aislado en `feature/workshop-manager-role`.

---

## Fuera de alcance

- Creación de roles personalizados dinámicos desde la UI (se mantiene RBAC estático robusto).
- Edición de permisos individuales por usuario fuera de la matriz del rol.
- Facturación recurrente por rol o usuario.

---

## Estado

**Completado e integrado en `develop`.**  
Las migraciones fueron aplicadas tanto en el entorno de desarrollo como en la base de datos productiva. El perfil de Ysabel Quinteros fue configurado como _Administrador del taller_ y el de Jhon Medina como _Dueño del taller_ en la organización "Grupo Mecatronic".

---

## Verificación técnica

- **API:** `prisma validate`, `typecheck` y `lint` en verde.
- **Web:** `typecheck`, `lint` y pruebas de navegación en verde.
- **Gitflow:** Commits convencionales integrados en `develop`.
