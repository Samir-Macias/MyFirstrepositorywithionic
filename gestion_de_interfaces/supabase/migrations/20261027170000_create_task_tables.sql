CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'TODO'
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'COMPLETED')),
  priority text NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  assigned_user_id uuid,
  assigned_user_name text,
  assigned_user_email text,
  created_by_user_id uuid NOT NULL DEFAULT auth.uid(),
  subtasks jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(subtasks) = 'array'),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(tags) = 'array'),
  estimated_hours numeric NOT NULL DEFAULT 0 CHECK (estimated_hours >= 0),
  logged_hours numeric NOT NULL DEFAULT 0 CHECK (logged_hours >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid DEFAULT auth.uid(),
  user_email text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  task_id uuid
);

ALTER TABLE public.tasks
  ALTER COLUMN status SET DEFAULT 'TODO',
  ALTER COLUMN priority SET DEFAULT 'MEDIUM';

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user
  ON public.tasks USING btree (assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_created_by
  ON public.tasks USING btree (created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
  ON public.tasks USING btree (status);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at
  ON public.tasks USING btree (created_at DESC);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_visible" ON public.tasks;
CREATE POLICY "tasks_select_visible"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by_user_id OR auth.uid() = assigned_user_id);

DROP POLICY IF EXISTS "tasks_insert_owned" ON public.tasks;
CREATE POLICY "tasks_insert_owned"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "tasks_update_visible" ON public.tasks;
CREATE POLICY "tasks_update_visible"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by_user_id OR auth.uid() = assigned_user_id)
  WITH CHECK (auth.uid() = created_by_user_id OR auth.uid() = assigned_user_id);

DROP POLICY IF EXISTS "tasks_delete_owned" ON public.tasks;
CREATE POLICY "tasks_delete_owned"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "activity_logs_select_visible" ON public.activity_logs;
CREATE POLICY "activity_logs_select_visible"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.tasks
      WHERE tasks.id = activity_logs.task_id
        AND (
          tasks.created_by_user_id = auth.uid()
          OR tasks.assigned_user_id = auth.uid()
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;
REVOKE ALL ON public.tasks, public.activity_logs FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.set_task_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.tasks'::regclass
      AND tgname IN ('set_tasks_updated_at', 'set_task_updated_at')
      AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER set_task_updated_at
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW
      EXECUTE FUNCTION public.set_task_updated_at();
  END IF;
END;
$block$;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;
END;
$block$;
