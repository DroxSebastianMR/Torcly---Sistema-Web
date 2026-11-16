-- La restricción original impedía abrir una caja en cualquier otra organización
-- cuando existía una sesión OPEN. La caja abierta es única por taller, no global.
DROP INDEX IF EXISTS "cash_sessions_single_open_idx";

CREATE UNIQUE INDEX "cash_sessions_organization_single_open_idx"
  ON "cash_sessions"("organization_id")
  WHERE "status" = 'OPEN';
