CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 160),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_super_admin_select ON public.organizations;
CREATE POLICY organizations_super_admin_select
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
  );

DROP POLICY IF EXISTS organizations_super_admin_insert ON public.organizations;
CREATE POLICY organizations_super_admin_insert
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by_user_id
    AND (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
      OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
    )
  );

DROP POLICY IF EXISTS organizations_super_admin_update ON public.organizations;
CREATE POLICY organizations_super_admin_update
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
  )
  WITH CHECK (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
  );

DROP POLICY IF EXISTS organizations_super_admin_delete ON public.organizations;
CREATE POLICY organizations_super_admin_delete
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
REVOKE ALL ON public.organizations FROM anon, PUBLIC;

DO $block$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid = 'public.profiles'::regclass
      AND confrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_organization_id_fkey
      FOREIGN KEY (organization_id)
      REFERENCES public.organizations(id)
      ON DELETE SET NULL;
  END IF;
END;
$block$;

DROP POLICY IF EXISTS profiles_super_admin_select ON public.profiles;
CREATE POLICY profiles_super_admin_select
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
    OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
  );

CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
  p_name text,
  p_slug text,
  p_admin_email text,
  p_admin_name text
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  created_by_user_id uuid,
  created_at timestamptz,
  corp_admin_email text,
  corp_admin_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_org public.organizations%ROWTYPE;
  v_profile_id uuid;
BEGIN
  IF auth.uid() IS NULL
    OR NOT (
      coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPER_ADMIN', false)
      OR coalesce(auth.jwt() -> 'app_metadata' -> 'roles' ? 'SUPER_ADMIN', false)
    )
  THEN
    RAISE EXCEPTION 'Solo SUPER_ADMIN puede crear espacios de trabajo.'
      USING ERRCODE = '42501';
  END IF;

  IF length(trim(coalesce(p_name, ''))) NOT BETWEEN 1 AND 160
    OR trim(coalesce(p_slug, '')) !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    OR trim(coalesce(p_admin_email, '')) = ''
    OR length(trim(coalesce(p_admin_name, ''))) < 2
  THEN
    RAISE EXCEPTION 'Los datos del espacio de trabajo o del administrador no son válidos.'
      USING ERRCODE = '22023';
  END IF;

  SELECT profile.id
    INTO v_profile_id
    FROM public.profiles AS profile
    WHERE lower(profile.email) = lower(trim(p_admin_email))
    LIMIT 1
    FOR UPDATE;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'No existe un perfil registrado con el correo indicado.'
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.organizations (name, slug, created_by_user_id)
  VALUES (trim(p_name), trim(p_slug), auth.uid())
  RETURNING * INTO v_org;

  UPDATE public.profiles
    SET organization_id = v_org.id,
        role = 'CORP_ADMIN',
        full_name = trim(p_admin_name)
    WHERE public.profiles.id = v_profile_id;

  RETURN QUERY
    SELECT v_org.id,
           v_org.name,
           v_org.slug,
           v_org.created_by_user_id,
           v_org.created_at,
           lower(trim(p_admin_email)),
           trim(p_admin_name);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_organization_with_admin(text, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(text, text, text, text)
  TO authenticated;
