-- Migration: Add data validation constraints
-- Date: 2026-11-17
-- Description: Implements email, phone, and data integrity constraints

-- 1. Add unique and format constraints to clients
ALTER TABLE public.clients
ADD CONSTRAINT clients_email_unique UNIQUE(email),
ADD CONSTRAINT clients_email_format 
  CHECK (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' AND char_length(email) <= 254),
ADD CONSTRAINT clients_phone_format
  CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
ADD CONSTRAINT clients_name_length
  CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
ADD CONSTRAINT clients_valid_status
  CHECK (status IN ('activo', 'inactivo', 'potencial'));

-- 2. Add constraints to tasks
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_title_length
  CHECK (char_length(title) >= 2 AND char_length(title) <= 255),
ADD CONSTRAINT tasks_valid_status
  CHECK (status IN ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'ARCHIVED')),
ADD CONSTRAINT tasks_valid_priority
  CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
ADD CONSTRAINT tasks_due_date_future
  CHECK (due_date IS NULL OR due_date > created_at);

-- 3. Create validation function for email
CREATE OR REPLACE FUNCTION validate_email_format(email text)
RETURNS boolean AS $$
BEGIN
  RETURN email ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    AND char_length(email) <= 254;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Create validation function for phone
CREATE OR REPLACE FUNCTION validate_phone_format(phone text)
RETURNS boolean AS $$
BEGIN
  RETURN phone IS NULL 
    OR phone ~ '^\+?[1-9]\d{1,14}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Create trigger to validate clients on insert/update
CREATE OR REPLACE FUNCTION validate_client_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar email si es provided
  IF NEW.email IS NOT NULL AND NOT validate_email_format(NEW.email) THEN
    RAISE EXCEPTION 'Email format invalid: %', NEW.email;
  END IF;

  -- Validar phone si es provided
  IF NEW.phone IS NOT NULL AND NOT validate_phone_format(NEW.phone) THEN
    RAISE EXCEPTION 'Phone format invalid (use E.164): %', NEW.phone;
  END IF;

  -- Validar nombre
  IF char_length(NEW.name) < 2 OR char_length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_client_data ON public.clients;
CREATE TRIGGER trigger_validate_client_data
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION validate_client_data();

-- 6. Create trigger to validate tasks on insert/update
CREATE OR REPLACE FUNCTION validate_task_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar título
  IF char_length(NEW.title) < 2 OR char_length(NEW.title) > 255 THEN
    RAISE EXCEPTION 'Task title must be between 2 and 255 characters';
  END IF;

  -- Validar que due_date sea en el futuro si se especifica
  IF NEW.due_date IS NOT NULL AND NEW.due_date <= NEW.created_at THEN
    RAISE EXCEPTION 'Due date must be in the future';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_task_data ON public.tasks;
CREATE TRIGGER trigger_validate_task_data
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION validate_task_data();

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION validate_email_format(text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_phone_format(text) TO authenticated;
