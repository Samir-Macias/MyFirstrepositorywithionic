ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'STANDARD_USER';

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    nullif(
      trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')),
      ''
    ),
    'STANDARD_USER'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_auth_user_to_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_to_profile();

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  users.id,
  users.email,
  nullif(
    trim(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', '')),
    ''
  ),
  'STANDARD_USER'
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;
