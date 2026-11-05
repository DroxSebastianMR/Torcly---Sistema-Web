-- Crear el rol de Administrador del taller
INSERT INTO "roles" ("id", "code", "name", "active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'workshop_manager', 'Administrador del taller', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET "name" = 'Administrador del taller', "active" = true;

-- Asignar todas las facultades operativas excepto users:read y users:write
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'workshop_manager'
  AND p."code" NOT IN ('users:read', 'users:write')
ON CONFLICT DO NOTHING;
