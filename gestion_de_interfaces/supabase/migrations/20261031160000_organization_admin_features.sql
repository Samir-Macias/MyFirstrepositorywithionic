-- Gestión de organizaciones: administración de equipo, asignación de tareas,
-- actividad por organización y mantenimiento desde el panel de SUPER_ADMIN.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $function$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false);
$function$;

-- Organización de la que el usuario autenticado es CORP_ADMIN (NULL si no lo es).
CREATE OR REPLACE FUNCTION public.current_admin_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT profile.organization_id
  FROM public.profiles AS profile
  WHERE profile.id = auth.uid()
    AND profile.role = 'CORP_ADMIN';
$function$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_admin_organization(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p_user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = p_user_id
        AND profile.organization_id IS NOT NULL
        AND profile.organization_id = public.current_admin_organization_id()
    );
$function$;

CREATE OR REPLACE FUNCTION public.task_in_admin_organization(p_creator_id uuid, p_assignee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.user_belongs_to_admin_organization(p_creator_id)
    OR public.user_belongs_to_admin_organization(p_assignee_id);
$function$;

CREATE OR REPLACE FUNCTION public.activity_in_admin_organization(p_user_id uuid, p_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.user_belongs_to_admin_organization(p_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.tasks AS task
      WHERE task.id = p_task_id
        AND public.task_in_admin_organization(task.created_by_user_id, task.assigned_user_id)
    );
$function$;

REVOKE ALL ON FUNCTION
  public.is_super_admin(),
  public.current_admin_organization_id(),
  public.user_belongs_to_admin_organization(uuid),
  public.task_in_admin_organization(uuid, uuid),
  public.activity_in_admin_organization(uuid, uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.is_super_admin(),
  public.current_admin_organization_id(),
  public.user_belongs_to_admin_organization(uuid),
  public.task_in_admin_organization(uuid, uuid),
  public.activity_in_admin_organization(uuid, uuid)
  TO authenticated;

-- Invitaciones pendientes: cuentas que aún no se han registrado.
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE CHECK (email = lower(trim(email)) AND email <> ''),
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 2 AND 160),
  invited_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_invitations_admin_select ON public.organization_invitations;
CREATE POLICY organization_invitations_admin_select
  ON public.organization_invitations
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.current_admin_organization_id()
    OR public.is_super_admin()
  );

GRANT SELECT ON public.organization_invitations TO authenticated;
REVOKE ALL ON public.organization_invitations FROM anon, PUBLIC;

-- Políticas de lectura/edición para administradores de organización.
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_admin_select_organization ON public.profiles;
CREATE POLICY profiles_admin_select_organization
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_admin_organization_id()
  );

DROP POLICY IF EXISTS tasks_admin_select ON public.tasks;
CREATE POLICY tasks_admin_select
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (public.task_in_admin_organization(created_by_user_id, assigned_user_id));

DROP POLICY IF EXISTS tasks_admin_update ON public.tasks;
CREATE POLICY tasks_admin_update
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (public.task_in_admin_organization(created_by_user_id, assigned_user_id))
  WITH CHECK (public.task_in_admin_organization(created_by_user_id, assigned_user_id));

DROP POLICY IF EXISTS activity_logs_admin_select ON public.activity_logs;
CREATE POLICY activity_logs_admin_select
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (public.activity_in_admin_organization(user_id, task_id));

-- El rol y la organización de un perfil solo pueden cambiarse desde las funciones
-- de este esquema (o con service_role), nunca directamente desde el cliente.
CREATE OR REPLACE FUNCTION public.guard_profile_membership_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.role IS DISTINCT FROM 'STANDARD_USER' OR NEW.organization_id IS NOT NULL THEN
        RAISE EXCEPTION 'El rol y la organización no pueden fijarse desde el cliente.'
          USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
    THEN
      RAISE EXCEPTION 'El rol y la organización no pueden modificarse desde el cliente.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_profile_membership_changes ON public.profiles;
CREATE TRIGGER guard_profile_membership_changes
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_membership_changes();

-- El rol de la aplicación se lee del JWT (app_metadata); se mantiene alineado con profiles.role.
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_role text := CASE NEW.role WHEN 'CORP_ADMIN' THEN 'CORP_ADMIN' ELSE 'USER' END;
BEGIN
  UPDATE auth.users AS account
    SET raw_app_meta_data = coalesce(account.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('role', v_role, 'roles', jsonb_build_array(v_role))
    WHERE account.id = NEW.id
      AND coalesce(account.raw_app_meta_data ->> 'role', '') <> 'SUPER_ADMIN'
      AND NOT coalesce(account.raw_app_meta_data -> 'roles' ? 'SUPER_ADMIN', false);

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_profile_role_to_auth_metadata() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS sync_profile_role_to_auth_metadata ON public.profiles;
CREATE TRIGGER sync_profile_role_to_auth_metadata
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_profile_role_to_auth_metadata();

UPDATE auth.users AS account
  SET raw_app_meta_data = coalesce(account.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'CORP_ADMIN', 'roles', jsonb_build_array('CORP_ADMIN'))
  FROM public.profiles AS profile
  WHERE profile.id = account.id
    AND profile.role = 'CORP_ADMIN'
    AND coalesce(account.raw_app_meta_data ->> 'role', '') <> 'SUPER_ADMIN'
    AND NOT coalesce(account.raw_app_meta_data -> 'roles' ? 'SUPER_ADMIN', false);

-- Los registros nuevos con invitación pendiente entran directamente en su organización.
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_invitation public.organization_invitations%ROWTYPE;
BEGIN
  SELECT invitation.*
    INTO v_invitation
    FROM public.organization_invitations AS invitation
    WHERE invitation.email = lower(trim(NEW.email));

  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(
      nullif(
        trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')),
        ''
      ),
      v_invitation.full_name
    ),
    'STANDARD_USER',
    v_invitation.organization_id
  )
  ON CONFLICT (id) DO NOTHING;

  IF v_invitation.id IS NOT NULL THEN
    DELETE FROM public.organization_invitations WHERE id = v_invitation.id;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_auth_user_to_profile() FROM PUBLIC, anon, authenticated;

-- El historial indica qué tarea cambió y si se reasignó.
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
      'title', NEW.title,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_assignee', OLD.assigned_user_name,
      'new_assignee', NEW.assigned_user_name,
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

-- Añade una cuenta al equipo; si aún no existe queda como invitación pendiente.
CREATE OR REPLACE FUNCTION public.add_organization_member(p_email text, p_full_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org_id uuid := public.current_admin_organization_id();
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := trim(coalesce(p_full_name, ''));
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Solo el administrador de una organización puede añadir miembros.'
      USING ERRCODE = '42501';
  END IF;

  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    OR length(v_name) NOT BETWEEN 2 AND 160
  THEN
    RAISE EXCEPTION 'El nombre o el correo del miembro no son válidos.'
      USING ERRCODE = '22023';
  END IF;

  SELECT profile.*
    INTO v_profile
    FROM public.profiles AS profile
    WHERE lower(profile.email) = v_email
    FOR UPDATE;

  IF FOUND THEN
    IF coalesce(v_profile.role, 'STANDARD_USER') <> 'STANDARD_USER' THEN
      RAISE EXCEPTION 'Esa cuenta es administradora y no puede añadirse como miembro.'
        USING ERRCODE = '42501';
    END IF;
    IF v_profile.organization_id IS NOT NULL AND v_profile.organization_id <> v_org_id THEN
      RAISE EXCEPTION 'Esa cuenta ya pertenece a otra organización.'
        USING ERRCODE = '23505';
    END IF;

    UPDATE public.profiles
      SET organization_id = v_org_id,
          full_name = v_name
      WHERE id = v_profile.id;
    DELETE FROM public.organization_invitations WHERE email = v_email;

    RETURN 'LINKED';
  END IF;

  INSERT INTO public.organization_invitations (organization_id, email, full_name, invited_by_user_id)
  VALUES (v_org_id, v_email, v_name, auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name
    WHERE public.organization_invitations.organization_id = EXCLUDED.organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ese correo ya tiene una invitación de otra organización.'
      USING ERRCODE = '23505';
  END IF;

  RETURN 'INVITED';
END;
$function$;

-- Saca a un miembro de la organización y libera las tareas que otros le habían asignado.
CREATE OR REPLACE FUNCTION public.remove_organization_member(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org_id uuid := public.current_admin_organization_id();
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Solo el administrador de una organización puede eliminar miembros.'
      USING ERRCODE = '42501';
  END IF;

  SELECT profile.*
    INTO v_profile
    FROM public.profiles AS profile
    WHERE profile.id = p_user_id
      AND profile.organization_id = v_org_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El usuario no pertenece a tu organización.'
      USING ERRCODE = 'P0002';
  END IF;
  IF v_profile.id = auth.uid() OR coalesce(v_profile.role, 'STANDARD_USER') <> 'STANDARD_USER' THEN
    RAISE EXCEPTION 'No puedes eliminar a un administrador de la organización.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.tasks
    SET assigned_user_id = NULL,
        assigned_user_name = NULL,
        assigned_user_email = NULL
    WHERE assigned_user_id = v_profile.id
      AND created_by_user_id <> v_profile.id;

  UPDATE public.profiles
    SET organization_id = NULL
    WHERE id = v_profile.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_organization_invitation(p_invitation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org_id uuid := public.current_admin_organization_id();
BEGIN
  IF auth.uid() IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Solo el administrador de una organización puede cancelar invitaciones.'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.organization_invitations
    WHERE id = p_invitation_id
      AND organization_id = v_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La invitación no existe o no pertenece a tu organización.'
      USING ERRCODE = 'P0002';
  END IF;
END;
$function$;

-- Asigna (o desasigna con NULL) una tarea de la organización a un miembro de la misma.
CREATE OR REPLACE FUNCTION public.assign_task(p_task_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org_id uuid := public.current_admin_organization_id();
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_org_id IS NULL THEN
    RAISE EXCEPTION 'Solo el administrador de una organización puede asignar tareas.'
      USING ERRCODE = '42501';
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT profile.*
      INTO v_profile
      FROM public.profiles AS profile
      WHERE profile.id = p_user_id
        AND profile.organization_id = v_org_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Solo puedes asignar tareas a usuarios de tu organización.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.tasks AS task
    SET assigned_user_id = p_user_id,
        assigned_user_name = CASE
          WHEN p_user_id IS NULL THEN NULL
          ELSE coalesce(nullif(trim(v_profile.full_name), ''), v_profile.email)
        END,
        assigned_user_email = CASE WHEN p_user_id IS NULL THEN NULL ELSE v_profile.email END
    WHERE task.id = p_task_id
      AND public.task_in_admin_organization(task.created_by_user_id, task.assigned_user_id);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La tarea no existe o no pertenece a tu organización.'
      USING ERRCODE = 'P0002';
  END IF;
END;
$function$;

-- Elimina una organización devolviendo a sus miembros a usuarios estándar sin equipo.
CREATE OR REPLACE FUNCTION public.delete_organization(p_organization_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Solo SUPER_ADMIN puede eliminar espacios de trabajo.'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_organization_id) THEN
    RAISE EXCEPTION 'El espacio de trabajo no existe.'
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.profiles
    SET organization_id = NULL,
        role = 'STANDARD_USER'
    WHERE organization_id = p_organization_id;

  DELETE FROM public.organizations WHERE id = p_organization_id;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.add_organization_member(text, text),
  public.remove_organization_member(uuid),
  public.cancel_organization_invitation(uuid),
  public.assign_task(uuid, uuid),
  public.delete_organization(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.add_organization_member(text, text),
  public.remove_organization_member(uuid),
  public.cancel_organization_invitation(uuid),
  public.assign_task(uuid, uuid),
  public.delete_organization(uuid)
  TO authenticated;
