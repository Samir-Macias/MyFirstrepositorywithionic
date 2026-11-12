CREATE OR REPLACE FUNCTION public.prevent_task_creator_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id THEN
    RAISE EXCEPTION 'El creador de una tarea no puede cambiarse.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS prevent_task_creator_change ON public.tasks;
CREATE TRIGGER prevent_task_creator_change
  BEFORE UPDATE OF created_by_user_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_task_creator_change();
