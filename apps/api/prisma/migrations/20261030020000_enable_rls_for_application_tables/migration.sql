-- Torcly accede a PostgreSQL exclusivamente desde la API mediante Prisma.
-- Las tablas no se exponen directamente a los roles de la Data API de Supabase.
DO $$
DECLARE
  application_table text;
  application_tables text[] := ARRAY[
    'users',
    'assistant_conversations',
    'assistant_messages',
    'roles',
    'permissions',
    'user_roles',
    'role_permissions',
    'auth_sessions',
    'audit_logs',
    'customers',
    'vehicles',
    'product_categories',
    'product_brands',
    'product_units',
    'products',
    'services',
    'technicians',
    'inventory_movements',
    'sales',
    'appointments',
    'sale_lines',
    'work_orders',
    'work_order_lines',
    'work_order_activities',
    'work_order_consumptions',
    'payments',
    'cash_sessions',
    'replenishment_runs',
    'replenishment_recommendations',
    'password_reset_tokens',
    'maintenance_windows',
    'suppliers',
    'purchases',
    'purchase_lines',
    'notifications'
  ];
BEGIN
  FOREACH application_table IN ARRAY application_tables
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      application_table
    );
    EXECUTE format(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      application_table
    );
  END LOOP;
END
$$;

-- Los códigos correlativos también quedan fuera del acceso público.
REVOKE ALL PRIVILEGES ON SEQUENCE
  public.sales_code_seq,
  public.appointments_code_seq,
  public.work_orders_code_seq,
  public.payments_code_seq,
  public.replenishment_runs_code_seq,
  public.purchases_code_seq,
  public.technicians_code_seq,
  public.cash_sessions_code_seq
FROM PUBLIC, anon, authenticated;
