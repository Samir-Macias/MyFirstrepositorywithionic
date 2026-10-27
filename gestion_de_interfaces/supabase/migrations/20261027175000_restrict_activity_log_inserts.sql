DROP POLICY IF EXISTS "activity_insert" ON public.activity_logs;

REVOKE INSERT ON TABLE public.activity_logs
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_action text;
  v_user_id uuid := auth.uid();
  v_user_email text := auth.jwt() ->> 'email';
  v_task_id uuid;
  v_details jsonb;
  v_updated_fields jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'TASK_CREATED';
    v_task_id := NEW.id;
    v_details := jsonb_build_object(
      'title', NEW.title,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(
      jsonb_agg(changed.key ORDER BY changed.key),
      '[]'::jsonb
    )
    INTO v_updated_fields
    FROM jsonb_each(to_jsonb(NEW)) AS changed(key, value)
    WHERE to_jsonb(OLD) -> changed.key IS DISTINCT FROM changed.value
      AND changed.key <> 'updated_at';

    v_action := 'TASK_UPDATED';
    v_task_id := NEW.id;
    v_details := jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'updated_fields', v_updated_fields
    );
  ELSE
    v_action := 'TASK_DELETED';
    v_task_id := OLD.id;
    v_details := jsonb_build_object('title', OLD.title);
  END IF;

  INSERT INTO public.activity_logs (
    action,
    user_id,
    user_email,
    task_id,
    details
  )
  VALUES (
    v_action,
    v_user_id,
    v_user_email,
    v_task_id,
    v_details
  );

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS on_task_change_log ON public.tasks;

CREATE TRIGGER on_task_change_log
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_activity();
