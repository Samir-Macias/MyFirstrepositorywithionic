-- Migration: Add soft delete support and audit tables
-- Date: 2026-11-17
-- Description: Implements soft deletes and change auditing for data integrity

-- 1. Add soft delete columns to main tables
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.auth.users(id) ON DELETE SET NULL;

-- 2. Create audit table for tracking all changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  changed_by uuid REFERENCES public.auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create index for faster audits
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
ON public.audit_logs(table_name, record_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at
ON public.audit_logs(changed_at DESC);

-- 4. Update RLS policies to exclude soft-deleted records by default
DROP POLICY IF EXISTS "clients_select_visible" ON public.clients;
CREATE POLICY "clients_select_visible"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "tasks_select_visible" ON public.tasks;
CREATE POLICY "tasks_select_visible"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND (
      auth.uid() = created_by_user_id 
      OR auth.uid() = assigned_user_id
    )
  );

-- 5. Create functions for soft delete operations
CREATE OR REPLACE FUNCTION soft_delete_client(client_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.clients
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION soft_delete_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.tasks
  SET deleted_at = now(), deleted_by = auth.uid()
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Create function to audit changes
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (table_name, record_id, operation, old_values, new_values, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Create triggers for auditing
DROP TRIGGER IF EXISTS audit_clients_changes ON public.clients;
CREATE TRIGGER audit_clients_changes
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION audit_table_changes();

DROP TRIGGER IF EXISTS audit_tasks_changes ON public.tasks;
CREATE TRIGGER audit_tasks_changes
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION audit_table_changes();

-- 8. Prevent hard deletes on critical tables
CREATE OR REPLACE FUNCTION prevent_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Hard delete not allowed. Use soft_delete function instead.';
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger is optional - only enable if you want to completely prevent hard deletes
-- DROP TRIGGER IF EXISTS prevent_hard_delete_clients ON public.clients;
-- CREATE TRIGGER prevent_hard_delete_clients
-- BEFORE DELETE ON public.clients
-- FOR EACH ROW
-- WHEN (OLD.deleted_at IS NULL)  -- Only prevent if not already soft-deleted
-- EXECUTE FUNCTION prevent_hard_delete();

-- 9. Grant permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_task(uuid) TO authenticated;
